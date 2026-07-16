"use client";

// 경매 카드 무한 스크롤 그리드 (Client Component)
// 초기 목록(서버 렌더 첫 페이지)을 받아 표시하고, 스크롤이 하단 근처에 닿으면
// loadPage(다음 페이지 조회 함수)로 다음 페이지를 조회해 이어붙인다.
// loadPage 는 상위(서버 컴포넌트)에서 Server Action 을 바인딩해 주입한다 — 홈/내 상품이 동일 컴포넌트를 재사용한다.
// 표현은 기존 AuctionGrid 를 그대로 재사용하고(무수정), 이 컴포넌트는 데이터/스크롤만 관리한다.

import { useCallback, useEffect, useRef, useState } from "react";
import { AuctionGrid } from "@/components/auctions/auction-grid";
import { AuctionGridSkeleton } from "@/components/auctions/auction-grid-skeleton";
import type { AuctionSummary } from "@0625chopin/shared/types";
import type { AuctionSummaryPage } from "@/lib/queries";

interface AuctionGridInfiniteProps {
  /** 다음 페이지를 조회하는 함수 (page 번호 → 페이지 결과). 보통 Server Action 을 바인딩해 주입한다. */
  loadPage: (page: number) => Promise<AuctionSummaryPage>;
  /** 서버에서 렌더한 첫 페이지 목록 */
  initialAuctions: AuctionSummary[];
  /** 첫 페이지 기준 다음 페이지 존재 여부 */
  initialHasMore: boolean;
  /** 빈 목록일 때 표시할 문구 */
  emptyMessage?: string;
}

export function AuctionGridInfinite({
  loadPage,
  initialAuctions,
  initialHasMore,
  emptyMessage,
}: AuctionGridInfiniteProps) {
  const [auctions, setAuctions] = useState(initialAuctions);
  // 마지막으로 로드한 페이지 번호 (0 = 첫 페이지)
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // 스크롤 감지용 센티넬 요소
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 중복 로드 방지 (state 는 비동기라 즉시성이 필요한 가드는 ref 로)
  const loadingRef = useRef(false);

  // 상태 필터 전환 등으로 서버가 새 첫 페이지를 내려주면 목록을 초기화한다.
  useEffect(() => {
    setAuctions(initialAuctions);
    setHasMore(initialHasMore);
    setPage(0);
  }, [initialAuctions, initialHasMore]);

  // 다음 페이지 로드
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const result = await loadPage(nextPage);
      setAuctions((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, page, loadPage]);

  // 센티넬이 뷰포트(하단 200px 여유) 안에 들어오면 다음 페이지 로드
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return (
    <div className="space-y-3">
      <AuctionGrid auctions={auctions} emptyMessage={emptyMessage} />

      {/* 다음 페이지가 있을 때만 센티넬 + 로딩 스켈레톤 노출 */}
      {hasMore && (
        <div ref={sentinelRef} aria-hidden={!loading}>
          {loading && <AuctionGridSkeleton count={2} />}
        </div>
      )}
    </div>
  );
}
