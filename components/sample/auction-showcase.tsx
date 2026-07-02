// 경매 카드 + 상세 + 입찰 패널 쇼케이스 컴포넌트 (RSC)
// /sample 페이지에서 AuctionCard, AuctionGrid, 경매 상세, BidPanel 컴포넌트를 전시한다.
// 다양한 상태(active / won / failed)의 개별 카드와 전체 그리드 예시, 상세 뷰,
// BidPanel 상태별 4종(일반-즉시구매있음 / 일반-즉시구매없음 / 본인상품 / 비로그인) 포함.

import { AuctionCard } from "@/components/auctions/auction-card";
import { AuctionGrid } from "@/components/auctions/auction-grid";
import { AuctionStatusFilter } from "@/components/auctions/auction-status-filter";
import { AuctionGallery } from "@/components/auctions/auction-gallery";
import { AuctionInfo } from "@/components/auctions/auction-info";
import { SellerReputation } from "@/components/auctions/seller-reputation";
import { BidPanel } from "@/components/auctions/bid-panel";
import { WithdrawProductButton } from "@/components/auctions/withdraw-product-button";
import {
  mockAuctionSummaries,
  mockAuctionDetail,
  mockSellerReputations,
  MOCK_PRODUCT_STATUS_LABELS,
  MOCK_POLICIES,
} from "@/lib/mocks";
import type { AuctionSummary } from "@/lib/types";

export default function AuctionShowcase() {
  // 상태별 대표 카드 선택 (active·won·failed 각 1장)
  const activeAuction = mockAuctionSummaries.find(
    (a) => a.status === "active"
  ) as AuctionSummary;
  const wonAuction = mockAuctionSummaries.find(
    (a) => a.status === "won"
  ) as AuctionSummary;
  const failedAuction = mockAuctionSummaries.find(
    (a) => a.status === "failed"
  ) as AuctionSummary;

  // 상태별 대표 카드 목록 (null 방어)
  const statusCards = [activeAuction, wonAuction, failedAuction].filter(
    Boolean
  ) as AuctionSummary[];

  return (
    <section id="auctions" className="mb-16 scroll-mt-20">
      {/* 섹션 제목 */}
      <h2 className="mb-6 text-2xl font-bold text-foreground">경매 카드</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        홈 화면 2열 그리드에서 사용하는 경매 상품 카드입니다. 상태 배지(경매중 ·
        낙찰 · 유찰 · 내림)와 남은 시간 표시를 확인하세요. 카드 클릭 시{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">
          /auctions/[id]
        </code>{" "}
        상세 페이지로 이동합니다.
      </p>

      <div className="space-y-8">
        {/* ===== 상태별 개별 카드 전시 ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionCard — 상태별 (active · won · failed)
          </h3>
          {/* 2열 그리드로 개별 카드 비교 전시 */}
          <div className="grid grid-cols-2 gap-3">
            {statusCards.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </div>

        {/* ===== AuctionGrid 전체 목록 전시 ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionGrid — 전체 Mock 목록 (6건)
          </h3>
          <AuctionGrid auctions={mockAuctionSummaries} />
        </div>

        {/* ===== 내 상품 상태 필터 전시 (F0?? 내 상품) ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionStatusFilter — 내 상품 필터 (전체/경매중/낙찰/유찰/내림/완료)
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 font-mono text-xs">
              /my-products
            </code>{" "}
            상단 상태 필터입니다. 홈과 동일 컴포넌트를{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              basePath
            </code>{" "}
            /{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              defaultStatus=&quot;all&quot;
            </code>{" "}
            로 재사용하며, 로그인 사용자에게만 하단 탭이 노출됩니다.
          </p>
          <div className="mb-4">
            <AuctionStatusFilter
              current="all"
              labels={MOCK_PRODUCT_STATUS_LABELS}
              basePath="/my-products"
              defaultStatus="all"
            />
          </div>
          {/* 내가 올린 상품 목록 예시 (Mock 전체를 판매자 시점으로 표시) */}
          <AuctionGrid
            auctions={mockAuctionSummaries}
            emptyMessage="내 상품 전체이 없습니다."
          />
        </div>

        {/* ===== 빈 상태 전시 ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionGrid — 빈 상태 (Empty)
          </h3>
          {/* Phase 3에서 Empty 상태 전용 컴포넌트로 교체 예정 */}
          <AuctionGrid auctions={[]} />
        </div>

        {/* ===== 경매 상세 갤러리 전시 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionGallery — 대표 이미지 + 썸네일 스크롤
          </h3>
          {/* 430px 모바일 프레임 시뮬레이션 */}
          <div className="mx-auto max-w-[430px]">
            <AuctionGallery
              images={mockAuctionDetail.images}
              title={mockAuctionDetail.title}
            />
          </div>
        </div>

        {/* ===== 경매 상세 정보 전시 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionInfo — 가격·상태·메타·마감 정보 (active 샘플)
          </h3>
          <div className="mx-auto max-w-[430px]">
            <AuctionInfo detail={mockAuctionDetail} />
          </div>
        </div>

        {/* ===== 낙찰/유찰 상태 전시 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AuctionInfo — 낙찰(won) 상태 강조 배너
          </h3>
          <div className="mx-auto max-w-[430px]">
            {/* won 상태 샘플 (prod-4) */}
            <AuctionInfo
              detail={{
                ...mockAuctionDetail,
                status: "won",
                statusLabel: MOCK_PRODUCT_STATUS_LABELS.won,
                currentPrice: 55000,
                bidCount: 9,
              }}
            />
          </div>
        </div>

        {/* ===== 판매자 신뢰 정보 전시 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            SellerReputation — 판매자 신뢰 카드 (F012)
          </h3>
          {/* 판매자 샘플 여러 개 비교 */}
          <div className="mx-auto max-w-[430px] divide-y">
            {mockSellerReputations.map((seller) => (
              <SellerReputation key={seller.id} seller={seller} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== BidPanel 상태별 4종 전시 섹션 =====
// auction-showcase 내부에 병합. /sample#bid 앵커로 직접 진입 가능.
export function BidPanelShowcase() {
  return (
    <section id="bid" className="mb-16 scroll-mt-20">
      {/* 섹션 제목 */}
      <h2 className="mb-6 text-2xl font-bold text-foreground">입찰 패널</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        경매 상세 페이지의 입찰 / 즉시구매 패널입니다. 로그인 여부 · 본인 상품
        여부 · 즉시구매가 유무에 따라 4가지 상태로 렌더됩니다. 입찰가
        검증·낙관적 UI·즉시구매 확인 다이얼로그가 동작합니다(T031, Mock). 실제
        입찰/즉시구매 제출은 Phase 5에서 연결됩니다.
      </p>

      <div className="space-y-8">
        {/* ===== 1. 일반 — 즉시구매가 있음 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            BidPanel — 일반 (로그인 + 즉시구매가 있음)
          </h3>
          <div className="mx-auto max-w-[430px] p-4">
            {/* 빈티지 가죽 자켓 — 현재가 35,000원 / 즉시구매 80,000원 */}
            <BidPanel
              currentPrice={35000}
              buyNowPrice={80000}
              minBidIncrement={MOCK_POLICIES.min_bid_increment}
            />
          </div>
        </div>

        {/* ===== 2. 일반 — 즉시구매가 없음 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            BidPanel — 일반 (로그인 + 즉시구매가 없음, buyNowPrice=null)
          </h3>
          <div className="mx-auto max-w-[430px] p-4">
            {/* 접이식 캠핑 의자 — 현재가 18,000원 / 즉시구매 없음 */}
            <BidPanel
              currentPrice={18000}
              buyNowPrice={null}
              minBidIncrement={MOCK_POLICIES.min_bid_increment}
            />
          </div>
        </div>

        {/* ===== 3. 본인 상품 — 입찰 불가 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            BidPanel — 본인 상품 (isOwner=true)
          </h3>
          <div className="mx-auto max-w-[430px] p-4">
            {/* 본인 등록 상품 — 입찰 영역 비활성 */}
            <BidPanel
              currentPrice={55000}
              buyNowPrice={null}
              isOwner={true}
              minBidIncrement={MOCK_POLICIES.min_bid_increment}
            />
          </div>
        </div>

        {/* ===== 4. 비로그인 — 로그인 유도 ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            BidPanel — 비로그인 (isLoggedIn=false)
          </h3>
          <div className="mx-auto max-w-[430px] p-4">
            {/* 비로그인 상태 — 로그인 유도 메시지 + /auth/login 링크 */}
            <BidPanel
              currentPrice={450000}
              buyNowPrice={600000}
              isLoggedIn={false}
              minBidIncrement={MOCK_POLICIES.min_bid_increment}
            />
          </div>
        </div>

        {/* ===== 5. 판매자 상품 내리기 (T056) ===== */}
        <div className="overflow-hidden rounded-lg border">
          <h3 className="border-b px-6 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            WithdrawProductButton — 판매자 상품 내리기 (본인 + 진행중)
          </h3>
          <div className="mx-auto max-w-[430px] p-4">
            {/* 경매 상세에서 본인 active 상품일 때 노출. 입찰이 있으면 서버에서 차단 */}
            <WithdrawProductButton productId={mockAuctionDetail.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
