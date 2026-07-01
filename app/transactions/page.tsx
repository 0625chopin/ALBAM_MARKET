// 거래 목록 페이지 (RSC → Phase 5 T055 실데이터 전환)
// 현재 로그인 사용자가 판매자 또는 구매자로 참여한 거래를 목록으로 표시한다.
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { EmptyState } from "@/components/common/empty-state";
import { fetchUserTransactions } from "@/lib/queries/transactions";
import { getCurrentUserId } from "@/lib/queries";

export default async function TransactionsPage() {
  // 비로그인 차단
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  // 현재 사용자의 거래 목록 (실데이터)
  const items = await fetchUserTransactions();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 제목 */}
          <h1 className="mb-6 text-2xl font-bold text-foreground">거래</h1>

          {/* 거래 목록 (세로 목록, 430px 모바일 프레임 최적화) */}
          <div className="mx-auto max-w-[430px] space-y-3">
            {items.length === 0 ? (
              <EmptyState
                title="거래 내역이 없습니다"
                description="낙찰되거나 판매한 거래가 여기에 표시됩니다."
              />
            ) : (
              items.map((item) => (
                <TransactionCard
                  key={item.transaction.id}
                  transaction={item.transaction}
                  product={item.product}
                  role={item.role}
                  counterpartNickname={item.counterpartNickname}
                  chatRoomId={item.chatRoomId}
                />
              ))
            )}
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
