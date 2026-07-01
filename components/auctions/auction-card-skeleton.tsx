// 경매 카드 스켈레톤 (RSC)
// AuctionCard 레이아웃(aspect-square 이미지 + 제목 2줄 + 가격 + 메타)을 본떠 로딩 상태를 표시한다.
// AuctionGridSkeleton에서 여러 개 조합하여 사용.

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AuctionCardSkeletonProps {
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
}

export function AuctionCardSkeleton({ className }: AuctionCardSkeletonProps) {
  return (
    <div
      className={cn(
        // AuctionCard와 동일한 카드 컨테이너 스타일
        "flex flex-col overflow-hidden rounded-lg border bg-card",
        className
      )}
      aria-hidden="true"
    >
      {/* 이미지 영역 스켈레톤 — AuctionCard의 aspect-square와 동일 */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* 카드 본문 스켈레톤 */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {/* 제목 2줄 스켈레톤 */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* 현재가 스켈레톤 */}
        <Skeleton className="h-4 w-1/2" />

        {/* 메타 영역 스켈레톤 — 지역(좌) + 남은 시간(우) */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}
