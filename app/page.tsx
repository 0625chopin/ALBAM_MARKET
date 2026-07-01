// 알밤마켓 메인 홈 페이지 (서버 컴포넌트)
// Phase 5 T051: Mock → Supabase 실데이터 조회로 전환. AuctionGrid 는 무수정.

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionGrid } from "@/components/auctions/auction-grid";
import { fetchAuctionSummaries } from "@/lib/queries";

export default async function Home() {
  // 진행 중인 경매 카드 요약 (Supabase 실데이터)
  const auctions = await fetchAuctionSummaries();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-6">
          {/* 홈 헤더 — 진행 중인 경매 제목 */}
          <div className="mb-4 space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              진행 중인 경매
            </h1>
            <p className="text-sm text-muted-foreground">
              지금 입찰 가능한 상품을 확인하세요.
            </p>
          </div>

          {/* 경매 카드 2열 그리드 (Supabase 실데이터) */}
          <AuctionGrid auctions={auctions} />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
