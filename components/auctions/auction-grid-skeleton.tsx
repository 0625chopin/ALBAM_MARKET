// 경매 카드 그리드 스켈레톤 (RSC)
// AuctionGrid와 동일한 grid grid-cols-2 gap-3 레이아웃으로 AuctionCardSkeleton을 N개 렌더한다.
// 홈 로딩 화면(app/loading.tsx)과 새로고침 대기 중에 사용한다.

import { AuctionCardSkeleton } from "@/components/auctions/auction-card-skeleton";
import { cn } from "@0625chopin/shared/utils";

interface AuctionGridSkeletonProps {
  /** 렌더할 스켈레톤 카드 수 (기본값: 6) */
  count?: number;
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
}

export function AuctionGridSkeleton({
  count = 6,
  className,
}: AuctionGridSkeletonProps) {
  return (
    // AuctionGrid와 동일한 2열 그리드 레이아웃
    <div
      className={cn("grid grid-cols-2 gap-3", className)}
      aria-busy="true"
      aria-label="경매 목록 로딩 중"
    >
      {/* count 개수만큼 카드 스켈레톤 렌더 */}
      {Array.from({ length: count }).map((_, index) => (
        <AuctionCardSkeleton key={index} />
      ))}
    </div>
  );
}
