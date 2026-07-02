"use client";
// 상태 컴포넌트 전시 쇼케이스 (로딩 · 빈 상태 · 오류 3종)
// Tabs로 3가지 상태를 전환하며 확인할 수 있다.
// Tabs가 클라이언트 인터랙션이므로 'use client' 필요.

import { Package, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuctionGridSkeleton } from "@/components/auctions/auction-grid-skeleton";
import { TransactionCardSkeleton } from "@/components/transactions/transaction-card-skeleton";
import { MessageListSkeleton } from "@/components/chat/message-list-skeleton";
import { ProfileCardSkeleton } from "@/components/profile/profile-card-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";

export default function StateShowcase() {
  return (
    <section id="states" className="mb-16 scroll-mt-20">
      {/* 섹션 헤더 */}
      <h2 className="text-foreground mb-6 text-2xl font-bold">
        상태 (로딩/빈/에러)
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Loading · Empty · Error 3종 상태 컴포넌트. Tabs로 전환하며 확인할 수
        있습니다.
      </p>

      {/* Tabs로 3상태 전환 */}
      <Tabs defaultValue="loading">
        <TabsList className="mb-6">
          <TabsTrigger value="loading">로딩</TabsTrigger>
          <TabsTrigger value="empty">빈 상태</TabsTrigger>
          <TabsTrigger value="error">오류 상태</TabsTrigger>
        </TabsList>

        {/* ===== 로딩 탭 ===== */}
        <TabsContent value="loading">
          <div className="space-y-8">
            {/* 경매 그리드 스켈레톤 전시 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                경매 그리드 스켈레톤
              </h3>
              <AuctionGridSkeleton count={4} />
            </div>

            {/* 거래 카드 스켈레톤 전시 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                거래 카드 스켈레톤
              </h3>
              <div className="mx-auto max-w-[430px] space-y-3">
                <TransactionCardSkeleton />
                <TransactionCardSkeleton />
              </div>
            </div>

            {/* 채팅 메시지 스켈레톤 전시 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                채팅 메시지 스켈레톤
              </h3>
              {/* 높이를 제한하여 전시장 내에서 미리보기 */}
              <div className="mx-auto max-w-[430px] overflow-hidden rounded-lg border">
                <div className="flex h-64 flex-col">
                  <MessageListSkeleton />
                </div>
              </div>
            </div>

            {/* 프로필 카드 스켈레톤 전시 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                프로필 카드 스켈레톤
              </h3>
              <div className="mx-auto max-w-[430px]">
                <ProfileCardSkeleton />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== 빈 상태 탭 ===== */}
        <TabsContent value="empty">
          <div className="space-y-6">
            {/* 아이콘 + CTA 버튼 있는 버전 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                아이콘 + CTA 버튼
              </h3>
              <div className="rounded-lg border">
                <EmptyState
                  icon={Package}
                  title="진행 중인 경매가 없습니다"
                  description="아직 등록된 경매가 없어요. 첫 번째 경매를 등록해 보세요."
                  actionLabel="경매 등록하기"
                  actionHref="/auctions/new"
                />
              </div>
            </div>

            {/* 아이콘 없는 간소화 버전 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                아이콘 없음 (간소화 버전)
              </h3>
              <div className="rounded-lg border">
                <EmptyState
                  title="거래 내역이 없습니다"
                  description="아직 참여한 거래가 없습니다."
                />
              </div>
            </div>

            {/* CTA 없는 버전 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                CTA 없음
              </h3>
              <div className="rounded-lg border">
                <EmptyState
                  icon={ShoppingBag}
                  title="검색 결과가 없습니다"
                  description="다른 키워드로 검색해 보세요."
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== 오류 상태 탭 ===== */}
        <TabsContent value="error">
          <div className="space-y-6">
            {/* 재시도 버튼 포함 버전 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                재시도 버튼 포함
              </h3>
              <div className="rounded-lg border">
                {/* TODO: 실제 재시도 로직은 연동 시 구현 */}
                <ErrorState
                  title="데이터를 불러오지 못했습니다"
                  description="네트워크 연결을 확인하고 다시 시도해 주세요."
                  onRetry={() => {
                    // TODO: 실제 재시도 로직 구현 (데이터 재조회 등)
                    console.log("재시도 클릭");
                  }}
                />
              </div>
            </div>

            {/* 재시도 없는 표시 전용 버전 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                재시도 없음 (표시만)
              </h3>
              <div className="rounded-lg border">
                <ErrorState
                  title="문제가 발생했습니다"
                  description="잠시 후 다시 시도해 주세요."
                />
              </div>
            </div>

            {/* 기본값 사용 버전 */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                기본값 (title 기본값 사용)
              </h3>
              <div className="rounded-lg border">
                <ErrorState
                  onRetry={() => {
                    // TODO: 재시도 로직 구현
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
