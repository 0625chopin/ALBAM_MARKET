// 거래 목록 페이지 (RSC → Phase 5 T055 실데이터 전환)
// 현재 로그인 사용자가 판매자 또는 구매자로 참여한 거래를 목록으로 표시한다.
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { TransactionsRealtime } from "@/components/transactions/transactions-realtime";
import { EmptyState } from "@0625chopin/shared/common/empty-state";
import { fetchUserTransactions } from "@/lib/queries/transactions";
import { getCurrentUserId, fetchStatusLabels } from "@/lib/queries";
import type {
  ProductStatus,
  TransactionStatus,
} from "@0625chopin/shared/types";

export default async function TransactionsPage() {
  // 비로그인 차단
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  // 현재 사용자의 거래 목록 + 거래/상품 상태 라벨(DB 공통코드) 병행 조회
  // 상품 상태 라벨은 유찰(failed) 등 경매 결과를 거래 카드에 표시하기 위해 함께 조회한다.
  const [items, statusLabels, productLabels] = await Promise.all([
    fetchUserTransactions(),
    fetchStatusLabels("transaction_status"),
    fetchStatusLabels("product_status"),
  ]);
  // StatusBadge 주입용 타입으로 좁힘 (codes.transaction_status / product_status → value→label)
  const transactionStatusLabels = statusLabels as Record<
    TransactionStatus,
    string
  >;
  const productStatusLabels = productLabels as Record<ProductStatus, string>;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 거래 상태 변경(관리자·타 사용자) 실시간 반영 — 새로고침 없이 router.refresh */}
          <TransactionsRealtime userId={userId} />

          {/* 페이지 제목 */}
          <h1 className="text-foreground mb-6 text-2xl font-bold">거래</h1>

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
                  primaryImageUrl={item.primaryImageUrl}
                  role={item.role}
                  counterpartNickname={item.counterpartNickname}
                  chatRoomId={item.chatRoomId}
                  statusLabels={transactionStatusLabels}
                  productStatusLabels={productStatusLabels}
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
