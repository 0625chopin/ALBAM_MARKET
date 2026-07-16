-- ISSUE-034 P6: products.created_at 정렬 대응 인덱스 부재
--
-- 문제: lib/queries/auctions.ts 의 fetchAuctionSummaries(홈/목록, status 필터 가능)와
--   fetchMyProductSummaries(내 상품, seller_id 필터)가 모두
--   `.order("created_at", { ascending: false })` 로 최신순 페이지네이션(range)한다.
--   현재 products 에는 created_at 을 포함하는 인덱스가 없다 — 기존
--   idx_products_status / idx_products_seller_id 는 각각 단일 컬럼만 커버하므로,
--   "필터 + 정렬" 조합은 인덱스만으로 해결되지 않고 별도 Sort 단계나 더 넓은 스캔에 의존하게 된다.
--   (참고: 확인된 기존 인덱스 — products_pkey(id), idx_products_status(status),
--    idx_products_seller_id(seller_id), idx_products_winner_id(winner_id).
--    status/seller_id + created_at 조합 인덱스는 없음 — mcp__supabase__execute_sql 로
--    pg_indexes 조회해 사전 확인함, 2026-07-17 기준.)
--
-- 해결: 필터 컬럼 + created_at desc 복합 인덱스 2개 추가.
--   - products(status, created_at desc): 상태별 필터 + 최신순 정렬(fetchAuctionSummaries).
--     status="all"(필터 없음) 케이스는 이 인덱스로 정렬만 커버되진 않지만, 우선순위 지시에
--     따라 status/seller_id 복합 인덱스 2종만 추가한다(created_at 단독 인덱스는 범위 밖).
--   - products(seller_id, created_at desc): 내 상품 목록 최신순(fetchMyProductSummaries).
--
-- 주의(초안, 라이브 미적용):
--   이 프로젝트 원칙에 따라 이 파일은 DDL 초안만 담고 mcp__supabase__apply_migration 으로
--   원격에 반영하지 않았다(성능 담당은 execute_sql/list_migrations 읽기 조회만 허용됨).
--   실제 적용 전 아래를 검토할 것:
--   1) products 행 수 대비 인덱스 유지비용(쓰기 시 추가 인덱스 갱신 비용)이 읽기 이득보다
--      작은지 — 상품 테이블은 등록(insert) 대비 목록 조회(select) 비율이 훨씬 높을 것으로
--      예상되어 유리할 가능성이 크지만, 실측(get_advisors performance)으로 재확인 필요.
--   2) 적용 후 get_advisors(security/performance) 로 unused_index/중복 여부 재점검.
--   3) 기존 idx_products_status / idx_products_seller_id 단일 컬럼 인덱스는 이 마이그레이션에서
--      삭제하지 않는다(다른 쿼리 플랜이 여전히 단일 컬럼 인덱스를 쓸 수 있어 — 삭제 여부는
--      advisor 재확인 후 별도 판단할 것).

create index if not exists idx_products_status_created_at
  on public.products (status, created_at desc);

create index if not exists idx_products_seller_id_created_at
  on public.products (seller_id, created_at desc);
