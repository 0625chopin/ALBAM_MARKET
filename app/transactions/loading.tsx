// 거래 목록(/transactions) 로딩 UI (Next.js App Router loading.tsx 규약)
// page.tsx 골격(헤더 + main Container + 거래 목록)과 동일한 구조로 스켈레톤을 렌더한다.
// 헤더는 정적 SiteHeaderSkeleton 사용(Cache Components: 로딩 셸은 정적 prerender 대상).

import { SiteHeaderSkeleton } from "@/components/layout/site-header-skeleton";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { TransactionCardSkeleton } from "@/components/transactions/transaction-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeaderSkeleton />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 제목 스켈레톤 — page.tsx의 "거래" h1 자리 */}
          <Skeleton className="mb-6 h-8 w-16" />

          {/* 거래 목록 스켈레톤 — 430px 모바일 프레임 내 세로 목록 */}
          <div className="mx-auto max-w-[430px] space-y-3">
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
