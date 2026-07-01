// 알밤마켓 메인 홈 페이지 (서버 컴포넌트)
// Phase 5 T051: Mock → Supabase 실데이터 조회로 전환. AuctionGrid 는 무수정.
// 상단 상태 필터: ?status= 쿼리로 상태별 목록 조회(기본 "active" 경매중).

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionGrid } from "@/components/auctions/auction-grid";
import { AuctionStatusFilter } from "@/components/auctions/auction-status-filter";
import {
  fetchAuctionSummaries,
  type AuctionStatusFilterValue,
} from "@/lib/queries";

// 유효한 상태 필터 값 (전체 + 실제 상품 상태 5종)
const VALID_STATUS: AuctionStatusFilterValue[] = [
  "all",
  "active",
  "won",
  "failed",
  "withdrawn",
  "completed",
];

// 상태별 헤더 제목/설명
const STATUS_HEADINGS: Record<
  AuctionStatusFilterValue,
  { title: string; description: string }
> = {
  all: { title: "전체 경매", description: "모든 상태의 경매를 확인하세요." },
  active: {
    title: "진행 중인 경매",
    description: "지금 입찰 가능한 상품을 확인하세요.",
  },
  won: { title: "낙찰된 경매", description: "낙찰이 확정된 경매입니다." },
  failed: { title: "유찰된 경매", description: "입찰 없이 마감된 경매입니다." },
  withdrawn: {
    title: "내린 경매",
    description: "판매자가 내린 경매입니다.",
  },
  completed: { title: "완료된 경매", description: "거래가 완료된 경매입니다." },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // 쿼리 파라미터 → 유효한 상태만 채택, 기본값은 "active"(경매중)
  const { status } = await searchParams;
  const current: AuctionStatusFilterValue = VALID_STATUS.includes(
    status as AuctionStatusFilterValue
  )
    ? (status as AuctionStatusFilterValue)
    : "active";

  // 선택 상태의 경매 카드 요약 (Supabase 실데이터)
  const auctions = await fetchAuctionSummaries(current);
  const heading = STATUS_HEADINGS[current];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-6">
          {/* 홈 헤더 — 선택 상태에 맞는 제목 */}
          <div className="mb-4 space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              {heading.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {heading.description}
            </p>
          </div>

          {/* 상단 상태 필터 탭 */}
          <div className="mb-4">
            <AuctionStatusFilter current={current} />
          </div>

          {/* 경매 카드 2열 그리드 (Supabase 실데이터) */}
          <AuctionGrid
            auctions={auctions}
            emptyMessage={`${heading.title}가 없습니다.`}
          />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
