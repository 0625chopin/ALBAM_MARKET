// 경매 카드 그리드 컴포넌트 (RSC)
// 경매 요약 목록을 2열 그리드로 렌더한다.
// 430px 모바일 프레임 기준으로 grid-cols-2 고정.
// 빈 배열이면 안내 문구 표시 (Phase 3에서 Empty 상태 전용 컴포넌트로 교체 예정).

import { AuctionCard } from "@/components/auctions/auction-card";
import type { AuctionSummary } from "@/lib/types";

interface AuctionGridProps {
  /** 렌더할 경매 요약 목록 */
  auctions: AuctionSummary[];
  /** 빈 목록일 때 표시할 문구 (기본: "진행 중인 경매가 없습니다.") */
  emptyMessage?: string;
}

export function AuctionGrid({
  auctions,
  emptyMessage = "진행 중인 경매가 없습니다.",
}: AuctionGridProps) {
  // 빈 목록 처리 — Phase 3에서 Empty 상태 컴포넌트로 교체
  if (auctions.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    // 모바일 2열 고정 그리드 (gap-3 = 12px 간격)
    <div className="grid grid-cols-2 gap-3" role="list" aria-label="경매 목록">
      {auctions.map((auction) => (
        // role="listitem"은 Link 내부에서 사용 불가이므로 div 래퍼로 감싸지 않음
        // (접근성: Link 자체의 aria-label이 각 카드를 구분함)
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}
