// 거래 컴포넌트 전시 쇼케이스 (RSC)
// TransactionCard와 RatingModal을 다양한 상태로 전시한다.
import { TransactionCard } from "@/components/transactions/transaction-card";
import { RatingModal } from "@/components/transactions/rating-modal";
import {
  mockTransactions,
  mockProducts,
  mockChatRooms,
  CURRENT_USER_ID,
  getMockProfile,
  MOCK_TRANSACTION_STATUS_LABELS,
} from "@/lib/mocks";
import type { Transaction } from "@/lib/types";

// 전시 전용 합성 거래 — 구매자(CURRENT_USER_ID)·진행중 케이스.
// Mock 데이터에는 구매자+진행중 거래가 없어, 거래완료/낙찰 포기 액션을 전시하기 위해 추가한다.
const buyerPendingTransaction: Transaction = {
  id: "txn-demo-buyer",
  productId: "prod-5",
  sellerId: "prof-2",
  buyerId: CURRENT_USER_ID,
  finalPrice: 150000,
  status: "pending",
};

export default function TransactionsShowcase() {
  // 전시용 거래 데이터: txn-1(판매자·진행중), txn-2(구매자·완료), txn-3(구매자·자동완료)
  const showcaseTransactions = mockTransactions.slice(0, 3);

  // 구매자+진행중 데모 카드용 상품·상대방·채팅방 조회
  const buyerPendingProduct = mockProducts.find(
    (p) => p.id === buyerPendingTransaction.productId
  );
  const buyerPendingCounterpart = getMockProfile(
    buyerPendingTransaction.sellerId
  );

  return (
    <section id="transactions" className="mb-16 scroll-mt-20">
      <h2 className="text-foreground mb-6 text-2xl font-bold">거래</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        거래 목록 카드 — 역할(판매/구매)과 상태(진행중/완료/자동완료)에 따라
        액션 버튼이 달라집니다.
      </p>

      {/* TransactionCard 다양한 상태 전시 */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          TransactionCard
        </h3>

        {/* 430px 모바일 프레임 내 세로 목록 */}
        <div className="mx-auto max-w-[430px] space-y-3">
          {showcaseTransactions.map((transaction) => {
            // 거래 대상 상품 조회
            const product = mockProducts.find(
              (p) => p.id === transaction.productId
            );
            if (!product) return null;

            // 현재 사용자의 역할 판별
            const role =
              transaction.sellerId === CURRENT_USER_ID ? "seller" : "buyer";

            // 상대방 프로필 조회
            const counterpartId =
              role === "seller" ? transaction.buyerId : transaction.sellerId;
            const counterpartProfile = getMockProfile(counterpartId);

            // 연결된 채팅방 조회
            const chatRoom = mockChatRooms.find(
              (room) => room.transactionId === transaction.id
            );
            const chatRoomId = chatRoom ? chatRoom.id : null;

            return (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                product={product}
                role={role}
                counterpartNickname={counterpartProfile.nickname}
                chatRoomId={chatRoomId}
                statusLabels={MOCK_TRANSACTION_STATUS_LABELS}
              />
            );
          })}

          {/* 구매자·진행중 데모 — 거래완료 / 경매취소(낙찰 포기) 액션 전시 */}
          {buyerPendingProduct && (
            <TransactionCard
              transaction={buyerPendingTransaction}
              product={buyerPendingProduct}
              role="buyer"
              counterpartNickname={buyerPendingCounterpart.nickname}
              chatRoomId={null}
              statusLabels={MOCK_TRANSACTION_STATUS_LABELS}
            />
          )}
        </div>
      </div>

      {/* RatingModal 단독 전시 */}
      <div className="mt-8 space-y-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          RatingModal (단독 전시)
        </h3>
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground mb-4 text-sm">
            아래 버튼을 클릭하면 평점 모달이 열립니다. 별점(반 별 단위)·코멘트
            입력, 제출 검증, 닫을 때 초기화가 동작합니다(T032, Mock). 실제 평점
            반영은 Phase 5에서 연결됩니다.
          </p>
          <div className="flex flex-wrap gap-3">
            {/* 전시용 — transactionId는 더미(실제 제출은 완료 거래에서 동작) */}
            <RatingModal
              transactionId="00000000-0000-0000-0000-000000000000"
              counterpartNickname="다람쥐"
            />
            {/* 도토리상점에게 평점 남기기 */}
            <RatingModal
              transactionId="00000000-0000-0000-0000-000000000000"
              counterpartNickname="도토리상점"
              triggerLabel="도토리상점 평점 남기기"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
