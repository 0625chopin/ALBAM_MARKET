-- ISSUE-031: 관리자 정지(user_suspensions) 미검사
--
-- 문제: place_bid / buy_now / withdraw_product RPC와 상품 등록 트리거
--   (enforce_seller_penalty_limit)가 user_suspensions 를 전혀 확인하지 않는다.
--   관리자가 admin_suspend_user() 로 사용자를 정지시켜도, 정지된 사용자는 여전히
--   입찰/즉시구매/상품 내림/상품 등록을 자유롭게 할 수 있다 — 정지 조치가 무력화된다.
--
-- 해결: 공용 헬퍼 함수 assert_not_suspended(uid) 를 만들어 각 RPC/트리거 초입에서 호출한다.
--   활성 정지 판정 조건은 admin_lift_suspension() RPC(관리자 정지 해제)가 실제로 사용하는
--   조건과 동일하게 맞춘다: lifted_at IS NULL (관리자가 아직 해제하지 않음)
--   AND (ends_at IS NULL OR ends_at > now()) (영구 정지이거나 아직 만료 전).
--   user_suspensions.user_id 에는 이미 partial index idx_user_suspensions_active
--   (WHERE lifted_at IS NULL) 가 있어 추가 인덱스는 불필요하다.

-- =====================================================================================
-- 1) 공용 헬퍼: 활성 정지 시 예외
-- =====================================================================================

create or replace function public.assert_not_suspended(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if exists (
    select 1
    from public.user_suspensions
    where user_id = p_uid
      and lifted_at is null
      and (ends_at is null or ends_at > now())
  ) then
    raise exception '정지된 계정입니다. 관리자에게 문의해 주세요.';
  end if;
end;
$function$;

-- 프로젝트 컨벤션(harden_get_policy_int_revoke_public, revoke_execute_enforce_seller_penalty_limit
-- 등)과 동일하게, 내부 전용 헬퍼는 PUBLIC EXECUTE 를 명시적으로 회수한다.
-- (SECURITY DEFINER 함수 내부에서의 호출은 함수 소유자 권한으로 실행되므로 영향 없음)
revoke execute on function public.assert_not_suspended(uuid) from public;

-- =====================================================================================
-- 2) place_bid / buy_now / withdraw_product RPC 초입에 정지 검사 추가
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.place_bid(p_product_id uuid, p_amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_product public.products;
  v_min integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- ISSUE-031: 정지된 사용자는 입찰할 수 없다.
  perform public.assert_not_suspended(v_uid);

  -- 동시성: 상품 행 잠금 후 최신 상태 기준 재검증
  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception '상품을 찾을 수 없습니다.';
  end if;
  if v_product.seller_id = v_uid then
    raise exception '본인 상품에는 입찰할 수 없습니다.';
  end if;
  if v_product.status <> 'active' or now() >= v_product.auction_ends_at then
    raise exception '종료된 경매입니다.';
  end if;

  -- 최소 입찰가 = 현재가 + 최소 증가폭(정책 codes.policy.min_bid_increment)
  v_min := v_product.current_price + coalesce(public.get_policy_int('min_bid_increment'), 1000);
  if p_amount < v_min then
    raise exception '최소 입찰가 %원 이상으로 입찰해 주세요.', v_min;
  end if;

  insert into public.bids(product_id, bidder_id, amount, status)
  values (p_product_id, v_uid, p_amount, 'active');

  -- ISSUE-030: 소유자 컬럼 가드(enforce_products_owner_update_guard) 우회 — RPC 내부 정상 갱신
  perform set_config('albam.bypass_products_owner_guard', 'on', true);
  update public.products set current_price = p_amount where id = p_product_id;

  return p_amount;
end;
$function$;

CREATE OR REPLACE FUNCTION public.buy_now(p_product_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_product public.products;
  v_txn_id uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- ISSUE-031: 정지된 사용자는 즉시구매할 수 없다.
  perform public.assert_not_suspended(v_uid);

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception '상품을 찾을 수 없습니다.';
  end if;
  if v_product.seller_id = v_uid then
    raise exception '본인 상품은 구매할 수 없습니다.';
  end if;
  if v_product.status <> 'active' or now() >= v_product.auction_ends_at then
    raise exception '종료된 경매입니다.';
  end if;
  if v_product.buy_now_price is null then
    raise exception '즉시구매가 불가한 상품입니다.';
  end if;

  v_txn_id := public._award_auction(p_product_id, v_uid, v_product.buy_now_price);
  return v_txn_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.withdraw_product(p_product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_product public.products;
  v_has_bid boolean;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- ISSUE-031: 정지된 사용자는 상품을 내릴 수 없다.
  perform public.assert_not_suspended(v_uid);

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception '상품을 찾을 수 없습니다.';
  end if;
  if v_product.seller_id <> v_uid then
    raise exception '본인 상품만 내릴 수 있습니다.';
  end if;
  if v_product.status <> 'active' then
    raise exception '진행 중인 상품만 내릴 수 있습니다.';
  end if;

  -- ISSUE-006: 입찰이 있으면 패널티 부과 후 허용 (해당 패널티는 ISSUE-004 등록 제한 누적 대상)
  select exists(select 1 from public.bids where product_id = p_product_id) into v_has_bid;
  if v_has_bid then
    insert into public.penalties(user_id, reason, penalty_type)
      values (v_uid, '입찰 상품 내림', 'withdraw_with_bids');
  end if;

  -- ISSUE-030: 소유자 컬럼 가드 우회 — RPC 내부 정상 갱신
  perform set_config('albam.bypass_products_owner_guard', 'on', true);
  update public.products set status = 'withdrawn' where id = p_product_id;
end;
$function$;

-- =====================================================================================
-- 3) 상품 등록 트리거(enforce_seller_penalty_limit) 초입에 정지 검사 추가
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.enforce_seller_penalty_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_threshold int := coalesce(public.get_policy_int('penalty_restriction_threshold'), 3);
  v_window_days int := coalesce(public.get_policy_int('penalty_window_days'), 30);
  v_count int;
begin
  -- ISSUE-031: 정지된 사용자는 새 상품을 등록할 수 없다.
  perform public.assert_not_suspended(new.seller_id);

  select count(*) into v_count
  from public.penalties
  where user_id = new.seller_id
    and created_at > now() - make_interval(days => v_window_days);

  if v_count >= v_threshold then
    raise exception '누적 패널티로 경매 등록이 제한되었습니다. (최근 %일 %건)', v_window_days, v_count;
  end if;

  return new;
end;
$function$;
