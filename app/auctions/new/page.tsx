// 경매 등록 페이지 (Phase 2 T024 — 정적 마크업 완료)
// 서버 컴포넌트 페이지 안에 Client Component 폼 배치 (정상 패턴)
// Phase 3에서 제출 후 리다이렉트 등 라우팅 로직 추가 예정

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionForm } from "@/components/auctions/auction-form";

export default function AuctionNewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 헤더 */}
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold text-foreground">경매 등록</h1>
            <p className="text-sm text-muted-foreground">
              판매할 상품 정보를 입력하고 경매를 시작하세요.
            </p>
          </div>

          {/* 경매 등록 폼 — 430px 모바일 기준 중앙 정렬 */}
          <div className="mx-auto max-w-[430px]">
            <AuctionForm />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
