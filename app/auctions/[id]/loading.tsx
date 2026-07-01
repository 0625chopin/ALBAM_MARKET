// 경매 상세(/auctions/[id]) 로딩 UI (Next.js App Router loading.tsx 규약)
// page.tsx 골격(헤더 + main [갤러리+정보+입찰패널+판매자])과 동일한 구조로 스켈레톤을 렌더한다.
// page.tsx가 Container 없이 풀폭 레이아웃이므로 loading.tsx도 동일하게 처리.
// 헤더는 정적 SiteHeaderSkeleton 사용(Cache Components: 로딩 셸은 정적 prerender 대상).

import { SiteHeaderSkeleton } from "@/components/layout/site-header-skeleton";
import { SiteFooter } from "@/components/layout/site-footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuctionDetailLoading() {
  return (
    // page.tsx 최상위 래퍼와 동일한 클래스
    <div className="flex min-h-screen flex-col">
      <SiteHeaderSkeleton />

      <main className="flex flex-1 flex-col">
        <div className="flex flex-col">
          {/* 갤러리(AuctionGallery) 스켈레톤 — aspect-square 풀폭 이미지 */}
          <Skeleton className="aspect-square w-full rounded-none" />

          {/* 상품 정보(AuctionInfo) 스켈레톤 — 배지·제목·가격·메타 */}
          <div className="space-y-3 px-4 py-4">
            {/* 상태 배지 */}
            <Skeleton className="h-5 w-16 rounded-full" />
            {/* 상품 제목 */}
            <Skeleton className="h-6 w-3/4" />
            {/* 현재가 */}
            <Skeleton className="h-8 w-1/3" />
            {/* 메타(마감 시간·입찰수) */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* 입찰 패널(BidPanel) 스켈레톤 — px-4 py-4 래퍼 포함 */}
          <div className="px-4 py-4">
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* 판매자 신뢰 정보(SellerReputation) 스켈레톤 */}
          <div className="flex items-center gap-3 border-t px-4 py-4">
            {/* 아바타 */}
            <Skeleton className="size-10 rounded-full" />
            {/* 닉네임 + 별점 */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
