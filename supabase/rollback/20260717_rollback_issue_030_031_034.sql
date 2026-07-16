-- 롤백 스크립트: ISSUE-030 / 031 / 034 마이그레이션 되돌리기
-- 2026-07-17 적용 직전의 원본 함수 정의(pg_get_functiondef 캡처)로 복원한다.
-- 문제가 생기면 이 파일 전체를 apply_migration 또는 psql 로 실행하면 적용 전 상태로 돌아간다.
--
-- 복원 순서: (1) 새 트리거/함수 제거 → (2) 원본 함수 8종 복원 → (3) 원본 트리거 복원
--            → (4) assert_not_suspended 제거 → (5) 034 인덱스 제거

-- (1) ISSUE-030 소유자 컬럼 가드 트리거/함수 제거
drop trigger if exists enforce_products_owner_update_guard_before_update on public.products;
drop function if exists public.enforce_products_owner_update_guard();

-- (2) 원본 함수 8종 복원 (정지 검사/우회 플래그가 없던 원본)
CREATE OR REPLACE FUNCTION public.place_bid(p_product_id uuid, p_amount integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_product public.products;
  v_min integer;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;
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
  v_min := v_product.current_price + coalesce(public.get_policy_int('min_bid_increment'), 1000);
  if p_amount < v_min then
    raise exception '최소 입찰가 %원 이상으로 입찰해 주세요.', v_min;
  end if;
  insert into public.bids(product_id, bidder_id, amount, status)
  values (p_product_id, v_uid, p_amount, 'active');
  update public.products set current_price = p_amount where id = p_product_id;
  return p_amount;
end;
$function$;

CREATE OR REPLACE FUNCTION public.buy_now(p_product_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_product public.products;
  v_txn_id uuid;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;
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
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
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
  select exists(select 1 from public.bids where product_id = p_product_id) into v_has_bid;
  if v_has_bid then
    insert into public.penalties(user_id, reason, penalty_type)
      values (v_uid, '입찰 상품 내림', 'withdraw_with_bids');
  end if;
  update public.products set status = 'withdrawn' where id = p_product_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public._award_auction(p_product_id uuid, p_winner_id uuid, p_final_price integer)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  v_seller_id uuid;
  v_txn_id uuid;
begin
  update public.products
     set status = 'won', winner_id = p_winner_id, current_price = p_final_price
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

CREATE OR REPLACE FUNCTION public.abandon_won_auction(p_product_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
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
  if v_product.status <> 'won' or v_product.winner_id is distinct from v_uid then
    raise exception '낙찰 포기 권한이 없습니다.';
  end if;
  v_seller := v_product.seller_id;
  update public.transactions
     set status = 'canceled'
   where product_id = p_product_id and buyer_id = v_uid and status = 'pending';
  update public.bids
     set status = 'abandoned'
   where product_id = p_product_id and bidder_id = v_uid;
  insert into public.penalties(user_id, reason, penalty_type)
    values (v_uid, '낙찰 포기', 'abandon_won');
  select bidder_id, amount into v_next_bidder, v_next_amount
  from public.bids
  where product_id = p_product_id and status = 'active' and bidder_id <> v_uid
  order by amount desc, created_at asc
  limit 1;
  if v_next_bidder is not null then
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
    update public.products set status = 'failed', winner_id = null where id = p_product_id;
    return null;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.close_expired_auctions()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  v_count integer := 0;
  v_product record;
  v_top_bidder uuid;
  v_top_amount integer;
begin
  for v_product in
    select * from public.products
    where status = 'active' and auction_ends_at < now()
    for update skip locked
  loop
    select bidder_id, amount into v_top_bidder, v_top_amount
    from public.bids
    where product_id = v_product.id
    order by amount desc, created_at asc
    limit 1;
    if v_top_bidder is not null then
      perform public._award_auction(v_product.id, v_top_bidder, v_top_amount);
      update public.bids
         set status = 'won'
       where product_id = v_product.id and bidder_id = v_top_bidder and amount = v_top_amount;
    else
      update public.products set status = 'failed' where id = v_product.id;
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_seller_penalty_limit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  v_threshold int := coalesce(public.get_policy_int('penalty_restriction_threshold'), 3);
  v_window_days int := coalesce(public.get_policy_int('penalty_window_days'), 30);
  v_count int;
begin
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

-- (3) validate_auction_ends_at 원본 복원 + 원본 트리거(before insert)로 되돌림
CREATE OR REPLACE FUNCTION public.validate_auction_ends_at()
 RETURNS trigger LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.auction_ends_at < now() + interval '11 hours 59 minutes'
     OR NEW.auction_ends_at > now() + interval '7 days 1 minute' THEN
    RAISE EXCEPTION '경매 진행 시간은 12시간~7일 범위여야 합니다.';
  END IF;
  RETURN NEW;
END;
$function$;

drop trigger if exists validate_auction_ends_at_before_insert_or_update on public.products;
drop trigger if exists validate_auction_ends_at_before_insert on public.products;
create trigger validate_auction_ends_at_before_insert
  before insert on public.products
  for each row execute function public.validate_auction_ends_at();

-- (4) ISSUE-031 헬퍼 제거 (위에서 원본 함수 복원으로 호출부가 사라진 뒤 안전하게 제거)
drop function if exists public.assert_not_suspended(uuid);

-- (5) ISSUE-034 인덱스 제거
drop index if exists public.idx_products_status_created_at;
drop index if exists public.idx_products_seller_id_created_at;
