// 경매 등록 폼 쇼케이스 컴포넌트 (RSC)
// /sample 페이지에서 AuctionForm 컴포넌트를 430px 모바일 프레임으로 전시한다.

import { AuctionForm } from "@/components/auctions/auction-form";
import {
  MOCK_CATEGORY_OPTIONS,
  MOCK_REGION_OPTIONS,
  MOCK_PRODUCT_CONDITIONS,
  MOCK_AUCTION_DURATIONS,
  MOCK_POLICIES,
} from "@/lib/mocks";

export default function AuctionFormShowcase() {
  return (
    <section id="auction-form" className="mb-16 scroll-mt-20">
      {/* 섹션 제목 */}
      <h2 className="mb-6 text-2xl font-bold text-foreground">경매 등록 폼</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        경매 상품 등록 시 사용하는 폼입니다. 430px 모바일 프레임 기준으로
        전시합니다. 필수값·즉시구매가 검증과 제출 시뮬레이션이 동작합니다(T031,
        Mock). 이미지 업로드·실제 등록은 Phase 5에서 연결됩니다.
      </p>

      {/* 430px 모바일 프레임으로 폼 전시 */}
      <div className="mx-auto max-w-[430px] rounded-lg border bg-card p-4">
        <AuctionForm
          categories={MOCK_CATEGORY_OPTIONS}
          regions={MOCK_REGION_OPTIONS}
          conditions={MOCK_PRODUCT_CONDITIONS}
          durationOptions={MOCK_AUCTION_DURATIONS}
          auctionDurationHours={MOCK_POLICIES.default_auction_duration_hours}
        />
      </div>
    </section>
  );
}
