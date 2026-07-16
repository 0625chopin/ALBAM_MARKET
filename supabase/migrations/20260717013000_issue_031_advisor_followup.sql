-- ISSUE-031/030 적용 후 advisor 후속 보정
--
-- 1) assert_not_suspended: 내부 전용 헬퍼인데 Supabase 기본 grant 로 anon/authenticated 가
--    PostgREST RPC(/rest/v1/rpc/assert_not_suspended)로 호출 가능해 정지 여부를 탐지할 수 있다.
--    앞선 `revoke ... from public` 만으로는 anon/authenticated 직접 grant 가 남으므로 함께 회수한다.
--    (SECURITY DEFINER 함수 내부에서 place_bid 등이 호출하는 것은 소유자 권한이라 영향 없음)
revoke execute on function public.assert_not_suspended(uuid) from anon, authenticated;

-- 2) validate_auction_ends_at: search_path 미설정(role mutable) 경고 해소.
--    본문은 now()(pg_catalog)와 NEW/OLD 만 사용하므로 빈 search_path 로 안전하다. 트리거는
--    함수 oid 를 참조하므로 CREATE OR REPLACE 로 재정의해도 재바인딩 불필요.
create or replace function public.validate_auction_ends_at()
returns trigger
language plpgsql
set search_path = ''
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
