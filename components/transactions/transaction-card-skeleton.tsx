// 거래 카드 스켈레톤 (RSC)
// TransactionCard 레이아웃(썸네일 size-16 + 제목/배지 + 구분선 + 액션 버튼)을 본떠 로딩 상태를 표시한다.

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TransactionCardSkeletonProps {
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
}

export function TransactionCardSkeleton({
  className,
}: TransactionCardSkeletonProps) {
  return (
    <Card className={cn(className)} aria-hidden="true">
      <CardContent className="p-4">
        {/* 상품 정보 영역 스켈레톤 */}
        <div className="flex gap-3">
          {/* 상품 대표 이미지 썸네일 스켈레톤 — TransactionCard의 size-16과 동일 */}
          <Skeleton className="size-16 shrink-0 rounded-md" />

          {/* 제목 + 배지 + 가격 스켈레톤 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 상품 제목 스켈레톤 */}
            <Skeleton className="h-4 w-3/4" />

            {/* 역할 배지 + 상태 배지 스켈레톤 */}
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* 확정가 스켈레톤 */}
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>

        {/* 상대방 닉네임 스켈레톤 */}
        <Skeleton className="mt-2 h-3 w-28" />

        {/* 구분선 */}
        <Separator className="my-3" />

        {/* 액션 버튼 스켈레톤 */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
