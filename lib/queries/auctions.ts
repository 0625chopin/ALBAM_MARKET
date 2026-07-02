// 경매(상품) 조회 (Server Component 용)
// Mock(lib/mocks/products)과 동일한 도메인 계약을 반환한다. 페이지는 이 함수만 호출하고
// 표현 컴포넌트(AuctionGrid/Card/Gallery/Info/SellerReputation)는 수정하지 않는다.

import { createClient } from "@/lib/supabase/server";
import type { AuctionSummary, AuctionDetail, ProductStatus } from "@/lib/types";
import { toAuctionSummary, toAuctionDetail, toSellerReputation } from "./_map";
import { fetchCodeGroup, fetchStatusLabels } from "./codes";

/** 홈 상태 필터 값 — 실제 상품 상태 + "all"(전체) */
export type AuctionStatusFilterValue = ProductStatus | "all";

/**
 * 홈/목록 카드 요약 목록.
 * 대표 이미지를 단일 조인 select 로 함께 가져와 N+1 을 회피한다(최신 등록순).
 * @param status "all"이면 전체, 그 외 특정 상태만 조회(기본 "all").
 */
export async function fetchAuctionSummaries(
  status: AuctionStatusFilterValue = "all"
): Promise<AuctionSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, title, start_price, current_price, auction_ends_at, status, region, product_images(url, is_primary)"
    )
    .order("created_at", { ascending: false });

  // "all"이 아니면 상태로 필터
  if (status !== "all") query = query.eq("status", status);

  // 상태 표시 라벨(DB 공통코드) — 프로세스 단위 캐시라 목록 조회와 병행해도 저렴
  const [{ data, error }, statusLabels] = await Promise.all([
    query,
    fetchStatusLabels("product_status"),
  ]);
  if (error || !data) return [];
  return data.map((row) =>
    toAuctionSummary(row, statusLabels[row.status] ?? row.status)
  );
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
