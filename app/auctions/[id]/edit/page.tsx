// 경매 상품 정보 수정 페이지 (서버 컴포넌트 안에 Client 폼 배치)
// 판매자 본인 + active 상품만 접근 가능. 그 외는 상세로 되돌린다(서버 가드).
// 이 페이지는 초반 인증/소유자 조회로 cookies()를 읽으므로 정적 셸 prerender 대상이 아니다.
// 초반 인증 조회로 동적 렌더를 확정해 prerender 시 cookies() hang(ISSUE-011 계열)을 방지한다.

import { redirect, notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionEditForm } from "@/components/auctions/auction-edit-form";
import { fetchAuctionDetail, getCurrentUserId } from "@/lib/queries";

export default async function AuctionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 비로그인 차단 (미들웨어 이중 방어 + 동적 렌더 확정)
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  // 대상 상품 조회 — 미존재 시 404
  const detail = await fetchAuctionDetail(id);
  if (!detail) notFound();

  // 소유자 아님 or 진행 중(active)이 아니면 수정 불가 → 상세로 되돌림
  if (detail.sellerId !== userId || detail.status !== "active") {
    redirect(`/auctions/${id}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 헤더 */}
          <div className="mb-6 space-y-1">
            <h1 className="text-foreground text-2xl font-bold">
              상품 정보 수정
            </h1>
            <p className="text-muted-foreground text-sm">
              사진, 설명, 즉시구매가를 수정할 수 있습니다.
            </p>
          </div>

          {/* 수정 폼 — 430px 모바일 기준 중앙 정렬 */}
          <div className="mx-auto max-w-[430px]">
            <AuctionEditForm detail={detail} />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
