// 내 상품 페이지 (서버 컴포넌트) — 로그인 사용자가 올린 상품 목록
// 홈과 동일한 표현 컴포넌트(AuctionStatusFilter/AuctionGrid)를 재사용하되,
// seller_id 로 본인 상품만 조회한다. 상단 상태 필터: 전체/경매중/낙찰/유찰/내림/완료.
// 비로그인 접근은 /auth/login 으로 리다이렉트(미들웨어와 이중 방어).

import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionGrid } from "@/components/auctions/auction-grid";
import { AuctionStatusFilter } from "@/components/auctions/auction-status-filter";
import {
  getCurrentUserId,
  fetchMyProductSummaries,
  fetchStatusLabels,
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

// 상태별 헤더 제목/설명 (판매자 시점)
const STATUS_HEADINGS: Record<
  AuctionStatusFilterValue,
  { title: string; description: string }
> = {
  all: { title: "내 상품 전체", description: "내가 올린 모든 상품입니다." },
  active: {
    title: "경매 중인 내 상품",
    description: "지금 입찰이 진행 중인 상품입니다.",
  },
  won: { title: "낙찰된 내 상품", description: "낙찰이 확정된 상품입니다." },
  failed: {
    title: "유찰된 내 상품",
    description: "입찰 없이 마감된 상품입니다.",
  },
  withdrawn: { title: "내린 내 상품", description: "판매를 내린 상품입니다." },
  completed: {
    title: "완료된 내 상품",
    description: "거래가 완료된 상품입니다.",
  },
};

export default async function MyProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // 로그인 사용자 id — 비로그인 시 로그인 페이지로
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  // 쿼리 파라미터 → 유효한 상태만 채택, 기본값은 "all"(전체)
  const { status } = await searchParams;
  const current: AuctionStatusFilterValue = VALID_STATUS.includes(
    status as AuctionStatusFilterValue
  )
    ? (status as AuctionStatusFilterValue)
    : "all";

  // 본인 상품 요약(Supabase 실데이터) + 상태 라벨(DB 공통코드)
  const [products, statusLabels] = await Promise.all([
    fetchMyProductSummaries(userId, current),
    fetchStatusLabels("product_status"),
  ]);
  const heading = STATUS_HEADINGS[current];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-6">
          {/* 페이지 헤더 — 선택 상태에 맞는 제목 */}
          <div className="mb-4 space-y-1">
            <h1 className="text-foreground text-xl font-bold">
              {heading.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {heading.description}
            </p>
          </div>

          {/* 상단 상태 필터 탭 — 내 상품용(basePath/defaultStatus 주입) */}
          <div className="mb-4">
            <AuctionStatusFilter
              current={current}
              labels={statusLabels}
              basePath="/my-products"
              defaultStatus="all"
            />
          </div>

          {/* 내 상품 카드 2열 그리드 (Supabase 실데이터) */}
          <AuctionGrid
            auctions={products}
            emptyMessage={`${heading.title}이 없습니다.`}
          />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
