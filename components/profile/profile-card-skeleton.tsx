// 프로필 카드 스켈레톤 (RSC)
// ProfileCard 레이아웃(아바타 + 닉네임 + 지역 + 구분선 + 역할별 평판 2블록)을 본떠 로딩 상태를 표시한다.

import { Skeleton } from "@0625chopin/shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@0625chopin/shared/ui/card";
import { Separator } from "@0625chopin/shared/ui/separator";

export function ProfileCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardHeader className="pb-4">
        {/* 아바타 + 닉네임 + 지역 스켈레톤 (중앙 정렬) */}
        <div className="flex flex-col items-center gap-3">
          {/* 아바타 원형 스켈레톤 — ProfileCard의 size-16과 동일 */}
          <Skeleton className="size-16 rounded-full" />

          {/* 닉네임 스켈레톤 */}
          <Skeleton className="h-7 w-32" />

          {/* 지역 스켈레톤 */}
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>

      <CardContent>
        {/* 구분선 */}
        <Separator className="mb-5" />

        {/* 역할별 평판 블록 2개 스켈레톤 */}
        <div className="space-y-4">
          {/* 판매자 평판 블록 스켈레톤 */}
          <div className="space-y-2">
            {/* "판매자 평판" 라벨 스켈레톤 */}
            <Skeleton className="h-3 w-20" />
            {/* 레벨 배지 + 별점 스켈레톤 */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* 구매자 평판 블록 스켈레톤 */}
          <div className="space-y-2">
            {/* "구매자 평판" 라벨 스켈레톤 */}
            <Skeleton className="h-3 w-20" />
            {/* 레벨 배지 + 별점 스켈레톤 */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
