// 경매(상품) 조회 (Server Component 용)
// Mock(lib/mocks/products)과 동일한 도메인 계약을 반환한다. 페이지는 이 함수만 호출하고
// 표현 컴포넌트(AuctionGrid/Card/Gallery/Info/SellerReputation)는 수정하지 않는다.

import { createClient } from "@0625chopin/shared/supabase/server";
import type {
  AuctionSummary,
  AuctionDetail,
  ProductStatus,
} from "@0625chopin/shared/types";
import {
  toAuctionSummary,
  toAuctionDetail,
  toSellerReputation,
} from "@0625chopin/shared/queries/map";
import { fetchCodeGroup, fetchStatusLabels } from "./codes";
import { getCurrentUserId } from "./profiles";

/** 홈 상태 필터 값 — 실제 상품 상태 + "all"(전체) */
export type AuctionStatusFilterValue = ProductStatus | "all";

/**
 * 홈/목록 카드 한 페이지(무한 스크롤 단위) 크기.
 * 이 값만 조정하면 초기 로딩·추가 로딩 개수가 함께 바뀐다.
 */
export const AUCTION_PAGE_SIZE = 6;

/** 카드 요약 한 페이지 조회 결과 — 항목 + 다음 페이지 존재 여부 */
export interface AuctionSummaryPage {
  items: AuctionSummary[];
  hasMore: boolean;
}

/**
 * 홈/목록 카드 요약 한 페이지.
 * 대표 이미지를 단일 조인 select 로 함께 가져와 N+1 을 회피한다(최신 등록순).
 * 무한 스크롤을 위해 `AUCTION_PAGE_SIZE` 단위로 페이지네이션한다.
 * 다음 페이지 존재 여부(hasMore)는 한 개 더 조회(pageSize + 1)해 판단한다.
 * @param status "all"이면 전체, 그 외 특정 상태만 조회(기본 "all").
 * @param page 0부터 시작하는 페이지 번호(기본 0 — 첫 페이지).
 */
export async function fetchAuctionSummaries(
  status: AuctionStatusFilterValue = "all",
  page = 0
): Promise<AuctionSummaryPage> {
  const supabase = await createClient();
  const from = page * AUCTION_PAGE_SIZE;
  // range 는 양끝 포함(inclusive)이므로 pageSize + 1 개를 조회해 hasMore 를 판단한다.
  const to = from + AUCTION_PAGE_SIZE;
  let query = supabase
    .from("products")
    .select(
      "id, title, start_price, current_price, buy_now_price, auction_ends_at, status, region, product_images(url, is_primary)"
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  // "all"이 아니면 상태로 필터
  if (status !== "all") query = query.eq("status", status);

  // 상태 표시 라벨(DB 공통코드) — 프로세스 단위 캐시라 목록 조회와 병행해도 저렴
  const [{ data, error }, statusLabels] = await Promise.all([
    query,
    fetchStatusLabels("product_status"),
  ]);
  if (error || !data) return { items: [], hasMore: false };

  // pageSize 를 초과해 조회됐다면 다음 페이지가 존재한다. 초과분은 잘라낸다.
  const hasMore = data.length > AUCTION_PAGE_SIZE;
  const rows = hasMore ? data.slice(0, AUCTION_PAGE_SIZE) : data;
  return {
    items: rows.map((row) =>
      toAuctionSummary(row, statusLabels[row.status] ?? row.status)
    ),
    hasMore,
  };
}

/**
 * 내가 올린 상품 요약 한 페이지 (판매자 본인 상품).
 * fetchAuctionSummaries 와 동일한 페이지네이션 계약을 반환하되 seller_id 로 필터한다.
 * @param sellerId 판매자(로그인 사용자) id
 * @param status "all"이면 전체, 그 외 특정 상태만 조회(기본 "all").
 * @param page 0부터 시작하는 페이지 번호(기본 0 — 첫 페이지).
 */
export async function fetchMyProductSummaries(
  sellerId: string,
  status: AuctionStatusFilterValue = "all",
  page = 0
): Promise<AuctionSummaryPage> {
  const supabase = await createClient();
  const from = page * AUCTION_PAGE_SIZE;
  // range 는 양끝 포함(inclusive)이므로 pageSize + 1 개를 조회해 hasMore 를 판단한다.
  const to = from + AUCTION_PAGE_SIZE;
  let query = supabase
    .from("products")
    .select(
      "id, title, start_price, current_price, buy_now_price, auction_ends_at, status, region, product_images(url, is_primary)"
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  // "all"이 아니면 상태로 필터
  if (status !== "all") query = query.eq("status", status);

  // 상태 표시 라벨(DB 공통코드) — 프로세스 단위 캐시라 목록 조회와 병행해도 저렴
  const [{ data, error }, statusLabels] = await Promise.all([
    query,
    fetchStatusLabels("product_status"),
  ]);
  if (error || !data) return { items: [], hasMore: false };

  // pageSize 를 초과해 조회됐다면 다음 페이지가 존재한다. 초과분은 잘라낸다.
  const hasMore = data.length > AUCTION_PAGE_SIZE;
  const rows = hasMore ? data.slice(0, AUCTION_PAGE_SIZE) : data;
  return {
    items: rows.map((row) =>
      toAuctionSummary(row, statusLabels[row.status] ?? row.status)
    ),
    hasMore,
  };
}

/**
 * 경매 상세. 미존재 시 null.
 * 상품(이미지·카테고리 임베드) → 판매자 프로필 → 평판 평균 별점 → 입찰 수 순으로 조합한다.
 */
export async function fetchAuctionDetail(
  id: string
): Promise<AuctionDetail | null> {
  const supabase = await createClient();

  // 상품 + 이미지
  const { data: product, error } = await supabase
    .from("products")
    .select("*, product_images(id, product_id, url, is_primary)")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) return null;

  // 카테고리/중고등급 코드 → 공통코드 라벨, 상태 라벨(모두 프로세스 단위 캐시)
  const [categoryOptions, conditionOptions, statusLabels] = await Promise.all([
    fetchCodeGroup("category"),
    fetchCodeGroup("product_condition"),
    fetchStatusLabels("product_status"),
  ]);
  const categoryLabel =
    categoryOptions.find((o) => o.value === product.category)?.label ??
    product.category;
  const conditionLabel =
    conditionOptions.find((o) => o.value === product.condition)?.label ??
    product.condition;
  const statusLabel = statusLabels[product.status] ?? product.status;

  // 판매자 프로필 + 평판 평균 별점
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, region, seller_level")
    .eq("id", product.seller_id)
    .maybeSingle();

  const { data: rep } = await supabase
    .from("profile_reputation")
    .select("seller_avg_score")
    .eq("profile_id", product.seller_id)
    .maybeSingle();

  const seller = toSellerReputation(
    sellerProfile ?? {
      id: product.seller_id,
      nickname: null,
      avatar_url: null,
      region: null,
      seller_level: 1,
    },
    rep?.seller_avg_score ?? 0
  );

  // 누적 입찰 수 (행 본문 없이 count 만)
  const { count: bidCount } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  return toAuctionDetail({
    product,
    images: product.product_images ?? [],
    categoryLabel,
    statusLabel,
    conditionLabel,
    seller,
    bidCount: bidCount ?? 0,
  });
}

/**
 * 현재 로그인 사용자가 특정 상품에 입찰한 누적 횟수.
 * BidPanel 의 "내 입찰 N회 반영됨" 초기값으로 주입해, 페이지 재진입/새로고침 후에도
 * 세션 카운터가 1부터 다시 시작하지 않고 실제 누적값에서 이어지도록 한다.
 * 비로그인 시 0.
 */
export async function fetchMyBidCount(productId: string): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("bidder_id", userId);

  return count ?? 0;
}
