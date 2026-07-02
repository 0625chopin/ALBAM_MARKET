// 경매 상세 페이지 (Phase 2 T022 → Phase 5 T051 실데이터 전환)
// cacheComponents 정석 패턴:
//   - 동기 default export(AuctionDetailPage)가 SiteHeader/main/SiteFooter 셸을 prerender.
//   - 동적 params는 Suspense 경계 안의 async 자식(AuctionDetailContent)에서 await.
//   - Suspense fallback은 non-null(스켈레톤 or 로딩 텍스트).
// T051: getMockAuctionDetail → Supabase 실 조회(fetchAuctionDetail)로 교체. 컴포넌트 무수정.

import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuctionGallery } from "@/components/auctions/auction-gallery";
import { AuctionInfo } from "@/components/auctions/auction-info";
import { SellerReputation } from "@/components/auctions/seller-reputation";
import { BidPanel } from "@/components/auctions/bid-panel";
import { WithdrawProductButton } from "@/components/auctions/withdraw-product-button";
import {
  fetchAuctionDetail,
  getCurrentUserId,
  fetchPolicies,
} from "@/lib/queries";

// ===== 상세 스켈레톤 (Suspense fallback) =====
// 상세 레이아웃(이미지·제목·가격) 형태에 맞춘 자체 스켈레톤.
function AuctionDetailSkeleton() {
  return (
    <div
      className="w-full animate-pulse space-y-4"
      aria-busy="true"
      aria-label="경매 상세 로딩 중"
    >
      {/* 대표 이미지 자리 */}
      <div className="aspect-square w-full bg-muted" />
      {/* 제목·가격 자리 */}
      <div className="space-y-3 px-4">
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="h-6 w-3/4 rounded bg-muted" />
        <div className="h-8 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

// ===== 동기 페이지 컴포넌트 (cacheComponents 패턴 — 셸 prerender) =====
export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    // 430px 모바일 프레임 — 세로 스택, 풀폭
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Suspense: params await는 async 자식에서만 수행 */}
        <Suspense fallback={<AuctionDetailSkeleton />}>
          <AuctionDetailContent params={params} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}

// ===== async 자식: params await + 데이터 조회 + 컴포넌트 렌더 =====
async function AuctionDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 동적 라우트 파라미터 취득
  const { id } = await params;

  // Supabase 실 조회 (미존재 id는 404)
  const detail = await fetchAuctionDetail(id);
  if (!detail) notFound();

  // 세션 기반 입찰 패널 상태 (본인 상품/로그인 여부)
  const userId = await getCurrentUserId();
  const isLoggedIn = userId !== null;
  const isOwner = userId === detail.sellerId;

  // 최소 입찰 증가폭(DB 정책값) — 클라이언트 UX 사전검증용 주입
  const policies = await fetchPolicies();

  return (
    // 430px 모바일 세로 스택 레이아웃 (패딩 없음, 컴포넌트가 자체 px 관리)
    <div className="flex flex-col">
      {/* 상품 이미지 갤러리 */}
      <AuctionGallery images={detail.images} title={detail.title} />

      {/* 상품 정보 (가격·상태·메타) */}
      <AuctionInfo detail={detail} />

      {/* 입찰 / 즉시구매 패널 (T023) — 세션 기반 isOwner/isLoggedIn 전달 */}
      <div className="space-y-3 px-4 py-4">
        <BidPanel
          productId={detail.id}
          currentPrice={detail.currentPrice}
          buyNowPrice={detail.buyNowPrice}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          minBidIncrement={policies.min_bid_increment}
        />

        {/* 판매자 본인 + 진행중일 때 상품 정보 수정 / 상품 내리기 (T056) */}
        {isOwner && detail.status === "active" && (
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/auctions/${detail.id}/edit`}>상품 정보 수정</Link>
            </Button>
            <WithdrawProductButton productId={detail.id} />
          </div>
        )}
      </div>

      {/* 판매자 신뢰 정보 (F012) */}
      <SellerReputation seller={detail.seller} />
    </div>
  );
}
