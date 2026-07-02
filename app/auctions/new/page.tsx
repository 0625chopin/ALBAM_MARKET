// 경매 등록 페이지 (서버 컴포넌트 안에 Client Component 폼 배치)
// 폼 옵션/정책값·패널티 이용제한 상태를 서버에서 조회해 폼에 주입한다.
// 제출 성공 시 폼(auction-form)이 상세 페이지로 router.push 한다.

import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { AuctionForm } from "@/components/auctions/auction-form";
import {
  getCurrentUserId,
  fetchCategoryOptions,
  fetchCodeGroup,
  fetchAuctionDurationOptions,
  fetchPolicies,
  fetchMyPenaltyStatus,
} from "@/lib/queries";

export default async function AuctionNewPage() {
  // 비로그인 차단 (미들웨어 이중 방어 + Cache Components 동적 렌더 확정)
  // 이 페이지는 auth-button/패널티 조회로 cookies() 를 읽으므로 정적 셸 prerender 대상이 아니다.
  // 초반 인증 조회로 동적 렌더를 확정해 prerender 시 cookies() hang(ISSUE-011 계열)을 방지한다.
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  // 폼 옵션/정책값을 DB 공통코드에서 조회해 Client 폼에 주입 (미주입 시 상수 폴백)
  // penaltyStatus: 누적 패널티 이용 제한(ISSUE-004) UX 사전검증용 (최종 강제는 서버 트리거)
  const [
    categories,
    regions,
    conditions,
    durationOptions,
    policies,
    penaltyStatus,
  ] = await Promise.all([
    fetchCategoryOptions(),
    fetchCodeGroup("region"),
    fetchCodeGroup("product_condition"),
    fetchAuctionDurationOptions(),
    fetchPolicies(),
    fetchMyPenaltyStatus(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 헤더 */}
          <div className="mb-6 space-y-1">
            <h1 className="text-foreground text-2xl font-bold">경매 등록</h1>
            <p className="text-muted-foreground text-sm">
              판매할 상품 정보를 입력하고 경매를 시작하세요.
            </p>
          </div>

          {/* 경매 등록 폼 — 430px 모바일 기준 중앙 정렬 */}
          <div className="mx-auto max-w-[430px]">
            <AuctionForm
              categories={categories}
              regions={regions}
              conditions={conditions}
              durationOptions={durationOptions}
              auctionDurationHours={policies.default_auction_duration_hours}
              restricted={penaltyStatus.restricted}
              penaltyCount={penaltyStatus.count}
              penaltyThreshold={penaltyStatus.threshold}
              penaltyWindowDays={penaltyStatus.windowDays}
            />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
