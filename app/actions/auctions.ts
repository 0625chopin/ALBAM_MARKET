"use server";

// 경매 목록 무한 스크롤용 Server Action
// 클라이언트(AuctionGridInfinite)가 스크롤 하단에 도달하면 다음 페이지를 이 액션으로 요청한다.
// 실제 조회는 fetchAuctionSummaries(status, page)에 위임하며, 외부 입력(status/page)은 여기서 검증한다.

import {
  fetchAuctionSummaries,
  fetchMyProductSummaries,
  getCurrentUserId,
  AUCTION_STATUS_VALUES,
  type AuctionStatusFilterValue,
  type AuctionSummaryPage,
} from "@/lib/queries";

// 허용되는 상태 필터 값 (전체 + 실제 상품 상태 6종). AUCTION_STATUS_VALUES 를 단일 소스로 재사용한다.
const VALID_STATUS: readonly AuctionStatusFilterValue[] = AUCTION_STATUS_VALUES;

/**
 * 경매 목록의 다음 페이지를 조회한다.
 * @param status 상태 필터 값 (유효하지 않으면 "all"로 대체)
 * @param page 0부터 시작하는 페이지 번호 (음수/비정수면 0으로 대체)
 */
export async function loadMoreAuctions(
  status: string,
  page: number
): Promise<AuctionSummaryPage> {
  const safeStatus = VALID_STATUS.includes(status as AuctionStatusFilterValue)
    ? (status as AuctionStatusFilterValue)
    : "all";
  const safePage = Number.isInteger(page) && page > 0 ? page : 0;
  return fetchAuctionSummaries(safeStatus, safePage);
}

/**
 * 내 상품 목록의 다음 페이지를 조회한다.
 * seller_id 는 클라이언트 입력이 아니라 서버 세션에서 확인하여(getCurrentUserId) 타인 상품 조회를 차단한다.
 * @param status 상태 필터 값 (유효하지 않으면 "all"로 대체)
 * @param page 0부터 시작하는 페이지 번호 (음수/비정수면 0으로 대체)
 */
export async function loadMoreMyProducts(
  status: string,
  page: number
): Promise<AuctionSummaryPage> {
  const userId = await getCurrentUserId();
  if (!userId) return { items: [], hasMore: false };
  const safeStatus = VALID_STATUS.includes(status as AuctionStatusFilterValue)
    ? (status as AuctionStatusFilterValue)
    : "all";
  const safePage = Number.isInteger(page) && page > 0 ? page : 0;
  return fetchMyProductSummaries(userId, safeStatus, safePage);
}
