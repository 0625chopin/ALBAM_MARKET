// 알밤마켓 메인 홈 페이지 (서버 컴포넌트)
// Phase 5 T051: Mock → Supabase 실데이터 조회로 전환. AuctionGrid 는 무수정.
// 상단 상태 필터: ?status= 쿼리로 상태별 목록 조회(기본 "active" 경매중).

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionGridInfinite } from "@/components/auctions/auction-grid-infinite";
import { AuctionStatusFilter } from "@/components/auctions/auction-status-filter";
import { SiteVisitCounter } from "@/components/site-visit-counter";
import { loadMoreAuctions } from "@/app/actions/auctions";
import {
  fetchAuctionSummaries,
  fetchStatusLabels,
  fetchSiteCounter,
  type AuctionStatusFilterValue,
} from "@/lib/queries";

// 유효한 상태 필터 값 (전체 + 실제 상품 상태 6종)
const VALID_STATUS: AuctionStatusFilterValue[] = [
  "all",
  "active",
  "won",
  "failed",
  "withdrawn",
  "completed",
  "force_closed",
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
  force_closed: {
    title: "강제종료된 경매",
    description: "관리자가 강제 종료한 경매입니다.",
  },
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

  // 선택 상태의 경매 카드 요약 첫 페이지 (Supabase 실데이터, 무한 스크롤 단위)
  // + 상태 라벨(DB 공통코드) + 누적 방문 수
  const [firstPage, statusLabels, visitCount] = await Promise.all([
    fetchAuctionSummaries(current),
    fetchStatusLabels("product_status"),
    fetchSiteCounter("home_visits"),
  ]);
  const heading = STATUS_HEADINGS[current];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-6">
          {/* 홈 헤더 — 선택 상태에 맞는 제목 + 누적 방문 수 */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-foreground text-xl font-bold">
                {heading.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {heading.description}
              </p>
            </div>
            <SiteVisitCounter initialCount={visitCount} />
          </div>

          {/* 상단 상태 필터 탭 */}
          <div className="mb-4">
            <AuctionStatusFilter current={current} labels={statusLabels} />
          </div>

          {/* 경매 카드 2열 그리드 — 무한 스크롤 (첫 페이지는 서버 렌더, 이후 Server Action 로딩) */}
          {/* status 를 바인딩한 Server Action 을 loadPage 로 주입 */}
          <AuctionGridInfinite
            loadPage={loadMoreAuctions.bind(null, current)}
            initialAuctions={firstPage.items}
            initialHasMore={firstPage.hasMore}
            emptyMessage={`${heading.title}가 없습니다.`}
          />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
