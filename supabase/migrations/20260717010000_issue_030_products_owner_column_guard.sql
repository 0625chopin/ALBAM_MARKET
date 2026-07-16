-- ISSUE-030: products RLS 컬럼 단위 보호 공백
--
-- 문제: products_update_own RLS 정책은 `(select auth.uid()) = seller_id` 만 검사한다.
--   즉 판매자 본인이면 description/buy_now_price 뿐 아니라
--   current_price / status / auction_ends_at / winner_id / title / start_price 등
--   "RPC(place_bid/buy_now/withdraw_product 등)를 통해서만 바뀌어야 하는 컬럼"까지
--   PostgREST(.from('products').update(...))로 직접 조작할 수 있다.
--   예) 자기 상품의 status 를 'won'으로, winner_id 를 자기 자신으로 바꿔 낙찰을 위조하거나,
--       current_price 를 낮춰 즉시구매가 우회, auction_ends_at 을 늘려 패널티 회피 등.
--
-- 해결: BEFORE UPDATE 트리거로 화이트리스트 검증을 추가한다.
--   - 관리자(is_admin())는 그대로 전체 컬럼 수정 가능 (products_update_admin RLS 대상 유지).
--   - RPC(SECURITY DEFINER) 내부의 정상 갱신은 트랜잭션 로컬 GUC 플래그
--     (`albam.bypass_products_owner_guard`)를 켜서 트리거를 통과시킨다.
--   - 그 외(=PostgREST 를 통한 소유자 직접 UPDATE)는 description, buy_now_price 두 컬럼만
--     변경을 허용하고, 나머지 컬럼이 하나라도 바뀌면 예외를 던진다.
--
-- 정상 경로 보존 근거: lib/mutations/auctions.ts 의 updateAuction() 은
--   `.from('products').update({ description, buy_now_price })` 만 호출한다(다른 컬럼 미포함).
--   → 아래 트리거의 화이트리스트(description, buy_now_price)와 정확히 일치하므로 막히지 않는다.
--
-- 참고: is_blinded 컬럼은 기존 protect_products_is_blinded 트리거가 별도로 보호하고 있으므로
--   이 트리거의 화이트리스트 검사 대상에서는 제외한다(중복 방지, 기존 트리거의 전용 메시지 유지).

-- =====================================================================================
-- 1) 소유자 직접 UPDATE 컬럼 화이트리스트 가드 트리거
-- =====================================================================================

create or replace function public.enforce_products_owner_update_guard()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  -- 관리자 갱신은 제한 없이 통과 (products_update_admin RLS 정책과 대응)
  if public.is_admin() then
    return new;
  end if;

  -- RPC(SECURITY DEFINER) 내부에서 명시적으로 켠 우회 플래그가 있으면 통과.
  -- place_bid / withdraw_product / abandon_won_auction / _award_auction /
  -- close_expired_auctions 가 각자 자신의 products UPDATE 직전에 이 플래그를 켠다.
  if coalesce(current_setting('albam.bypass_products_owner_guard', true), '') = 'on' then
    return new;
  end if;

  -- 그 외(=PostgREST 를 통한 소유자 직접 UPDATE, products_update_own RLS 경로)는
  -- description, buy_now_price 만 변경을 허용한다. 나머지 컬럼이 하나라도 바뀌면 차단.
  if new.seller_id       is distinct from old.seller_id
     or new.title         is distinct from old.title
     or new.condition     is distinct from old.condition
     or new.region        is distinct from old.region
     or new.category      is distinct from old.category
     or new.start_price   is distinct from old.start_price
     or new.current_price is distinct from old.current_price
     or new.status        is distinct from old.status
     or new.auction_ends_at is distinct from old.auction_ends_at
     or new.winner_id     is distinct from old.winner_id
  then
    raise exception '허용되지 않은 필드는 수정할 수 없습니다. (description, buy_now_price 만 직접 수정 가능)';
  end if;

  return new;
end;
$function$;

drop trigger if exists enforce_products_owner_update_guard_before_update on public.products;
create trigger enforce_products_owner_update_guard_before_update
  before update on public.products
  for each row execute function public.enforce_products_owner_update_guard();

-- =====================================================================================
-- 2) RPC 내부 정상 갱신에 우회 플래그 추가 (CREATE OR REPLACE — 기존 GRANT 는 유지됨)
-- =====================================================================================

-- place_bid: current_price 갱신
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

-- withdraw_product: status 갱신
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

-- abandon_won_auction: winner_id/current_price(재낙찰) 또는 status/winner_id(유찰) 갱신
CREATE OR REPLACE FUNCTION public.abandon_won_auction(p_product_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_product public.products;
  v_seller uuid;
  v_next_bidder uuid;
  v_next_amount integer;
  v_new_txn uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception '상품을 찾을 수 없습니다.';
  end if;
  -- 현재 낙찰자 본인만 포기 가능
  if v_product.status <> 'won' or v_product.winner_id is distinct from v_uid then
    raise exception '낙찰 포기 권한이 없습니다.';
  end if;
  v_seller := v_product.seller_id;

  -- ISSUE-030: 소유자 컬럼 가드 우회 — 아래 두 분기(재낙찰/유찰) 모두에 적용되도록 미리 설정
  perform set_config('albam.bypass_products_owner_guard', 'on', true);

  -- 기존 pending 거래 취소 (연결 채팅방은 거래 취소 상태로 남김)
  update public.transactions
     set status = 'canceled'
   where product_id = p_product_id and buyer_id = v_uid and status = 'pending';

  -- 포기자의 입찰 abandoned 처리 (차순위 선정에서 제외됨)
  update public.bids
     set status = 'abandoned'
   where product_id = p_product_id and bidder_id = v_uid;

  -- ISSUE-004: 포기자 패널티 기록 (누적 시 경매 등록 제한 — enforce_seller_penalty_limit)
  insert into public.penalties(user_id, reason, penalty_type)
    values (v_uid, '낙찰 포기', 'abandon_won');

  -- ISSUE-007(확정: 즉시 이양): 차순위 입찰자(포기자 제외, 유효 입찰 중 최고가) 조회
  select bidder_id, amount
    into v_next_bidder, v_next_amount
  from public.bids
  where product_id = p_product_id and status = 'active' and bidder_id <> v_uid
  order by amount desc, created_at asc
  limit 1;

  if v_next_bidder is not null then
    -- 차순위로 재낙찰 (won 유지, winner/current_price 교체) + 새 거래/채팅방 즉시 생성
    update public.products
       set winner_id = v_next_bidder, current_price = v_next_amount
     where id = p_product_id;
    insert into public.transactions(product_id, seller_id, buyer_id, final_price, status)
      values (p_product_id, v_seller, v_next_bidder, v_next_amount, 'pending')
      returning id into v_new_txn;
    insert into public.chat_rooms(transaction_id, seller_id, buyer_id)
      values (v_new_txn, v_seller, v_next_bidder);
    return v_new_txn;
  else
    -- 차순위 없음 → 유찰
    update public.products set status = 'failed', winner_id = null where id = p_product_id;
    return null;
  end if;
end;
$function$;

-- _award_auction: status/winner_id/current_price 갱신 (buy_now, close_expired_auctions 공통 경로)
CREATE OR REPLACE FUNCTION public._award_auction(p_product_id uuid, p_winner_id uuid, p_final_price integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_seller_id uuid;
  v_txn_id uuid;
begin
  -- ISSUE-030: 소유자 컬럼 가드 우회 — RPC 내부 정상 갱신(buy_now/close_expired_auctions 공통)
  perform set_config('albam.bypass_products_owner_guard', 'on', true);

  update public.products
     set status = 'won',
         winner_id = p_winner_id,
         current_price = p_final_price
   where id = p_product_id
   returning seller_id into v_seller_id;

  insert into public.transactions(product_id, seller_id, buyer_id, final_price, status)
  values (p_product_id, v_seller_id, p_winner_id, p_final_price, 'pending')
  returning id into v_txn_id;

  insert into public.chat_rooms(transaction_id, seller_id, buyer_id)
  values (v_txn_id, v_seller_id, p_winner_id);

  return v_txn_id;
end;
$function$;

-- close_expired_auctions: 유찰 분기에서 status 직접 갱신 (pg_cron 스케줄 실행, auth.uid() 없음)
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_count integer := 0;
  v_product record;
  v_top_bidder uuid;
  v_top_amount integer;
begin
  -- ISSUE-030: 소유자 컬럼 가드 우회 — pg_cron 실행 컨텍스트는 auth.uid() 가 없어
  -- is_admin() 판정도 불가능하므로, 이 함수 전체 트랜잭션에 대해 명시적으로 우회 플래그를 켠다.
  perform set_config('albam.bypass_products_owner_guard', 'on', true);

  for v_product in
    select * from public.products
    where status = 'active' and auction_ends_at < now()
    for update skip locked
  loop
    -- 최고 입찰 조회 (동가 시 먼저 들어온 입찰 우선)
    select bidder_id, amount
      into v_top_bidder, v_top_amount
    from public.bids
    where product_id = v_product.id
    order by amount desc, created_at asc
    limit 1;

    if v_top_bidder is not null then
      -- 낙찰: 공통 함수로 won 전환 + 거래(pending)/채팅방 생성 (buy_now 와 동일 로직 공유)
      perform public._award_auction(v_product.id, v_top_bidder, v_top_amount);
      -- 낙찰 입찰을 won 으로 표기
      update public.bids
         set status = 'won'
       where product_id = v_product.id
         and bidder_id = v_top_bidder
         and amount = v_top_amount;
    else
      -- 유찰
      update public.products set status = 'failed' where id = v_product.id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

-- =====================================================================================
-- 3) validate_auction_ends_at 트리거를 BEFORE INSERT OR UPDATE 로 확장 (방어 심화)
-- =====================================================================================
-- 위 1)의 소유자 컬럼 가드가 auction_ends_at 직접 변경을 이미 차단하지만, 향후 관리자 갱신
-- 등 다른 경로로 auction_ends_at 이 바뀌는 경우에도 12시간~7일 범위를 강제하기 위해 확장한다.
--
-- 주의: UPDATE 시 "auction_ends_at 값 자체가 바뀌지 않았다면" 범위 재검증을 건너뛰어야 한다.
-- 그렇지 않으면 마감이 임박한 상품(예: 2시간 뒤 마감)의 description/buy_now_price 만 수정하는
-- 정상 updateAuction() 흐름이, auction_ends_at 은 그대로인데 now() 만 흘러갔다는 이유로
-- "범위 밖"으로 오판되어 막혀버린다. 그래서 TG_OP='UPDATE' 이고 값이 동일하면 즉시 통과시킨다.

create or replace function public.validate_auction_ends_at()
returns trigger
language plpgsql
as $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.auction_ends_at IS NOT DISTINCT FROM OLD.auction_ends_at THEN
    RETURN NEW;
  END IF;

  IF NEW.auction_ends_at < now() + interval '11 hours 59 minutes'
     OR NEW.auction_ends_at > now() + interval '7 days 1 minute' THEN
    RAISE EXCEPTION '경매 진행 시간은 12시간~7일 범위여야 합니다.';
  END IF;
  RETURN NEW;
END;
$function$;

drop trigger if exists validate_auction_ends_at_before_insert on public.products;
create trigger validate_auction_ends_at_before_insert_or_update
  before insert or update on public.products
  for each row execute function public.validate_auction_ends_at();
