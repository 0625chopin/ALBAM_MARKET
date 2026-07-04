// 홈(/) 로딩 UI (Next.js App Router loading.tsx 규약)
// page.tsx 골격(헤더 + main Container + AuctionGrid)과 동일한 구조로 스켈레톤을 렌더한다.
// 헤더는 정적 SiteHeaderSkeleton 사용 — 로딩 셸은 정적 prerender 대상이므로
// 인증(Date.now 기반)에 의존하는 SiteHeader를 넣으면 Cache Components 규칙을 위반한다.

import { SiteHeaderSkeleton } from "@/components/layout/site-header-skeleton";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionGridSkeleton } from "@/components/auctions/auction-grid-skeleton";
import { Skeleton } from "@0625chopin/shared/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeaderSkeleton />

      <main className="flex flex-1 flex-col">
        <Container className="py-6">
          {/* 홈 헤더 영역 스켈레톤 — page.tsx의 제목 + 설명 자리 */}
          <div className="mb-4 space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>

          {/* 경매 카드 2열 그리드 스켈레톤 */}
          <AuctionGridSkeleton count={6} />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
