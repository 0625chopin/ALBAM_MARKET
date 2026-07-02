// 거래 카드 컴포넌트 (RSC)
// 거래 목록에서 각 거래의 요약 정보를 표시한다.
// 액션 영역(거래완료·낙찰 포기·상품 내리기·평점)은 클라이언트 인터랙션이 필요하므로
// components/transactions/transaction-actions.tsx(Client)로 분리했다. 카드 본문은 RSC 유지.
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImagePlaceholder } from "@/components/common/image-placeholder";
import { StatusBadge } from "@/components/common/status-badge";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { formatPrice } from "@/lib/format";
import type { Transaction, Product, TransactionStatus } from "@/lib/types";

interface TransactionCardProps {
  /** 거래 데이터 */
  transaction: Transaction;
  /** 거래 대상 상품 */
  product: Product;
  /** 현재 사용자의 역할 (판매자 | 구매자) */
  role: "seller" | "buyer";
  /** 거래 상대방 닉네임 */
  counterpartNickname: string;
  /** 연결된 채팅방 id (없으면 null) */
  chatRoomId: string | null;
  /** 거래 상태 라벨 맵 value→label (DB 공통코드 codes.transaction_status 주입) */
  statusLabels: Record<TransactionStatus, string>;
}

export function TransactionCard({
  transaction,
  product,
  role,
  counterpartNickname,
  chatRoomId,
  statusLabels,
}: TransactionCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {/* 상품 정보 영역 */}
        <div className="flex gap-3">
          {/* 상품 대표 이미지 (작은 썸네일) */}
          <ImagePlaceholder
            className="size-16 shrink-0 rounded-md"
            label={`${product.title} 상품 이미지`}
          />

          {/* 상품 제목 및 배지 묶음 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 상품 제목 */}
            <p className="truncate text-sm font-semibold text-foreground">
              {product.title}
            </p>

            {/* 역할·상태 배지 행 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 역할 배지: 판매 / 낙찰(구매) */}
              <Badge variant="outline" className="text-xs">
                {role === "seller" ? "판매" : "낙찰(구매)"}
              </Badge>
              {/* 거래 상태 배지 (초기 상태 — 액션 후 갱신 상태는 액션 영역에 표시) */}
              <StatusBadge
                kind="transaction"
                status={transaction.status}
                label={statusLabels[transaction.status]}
              />
            </div>

            {/* 확정가 */}
            <p className="text-sm font-bold text-foreground">
              {formatPrice(transaction.finalPrice)}
            </p>
          </div>
        </div>

        {/* 상대방 닉네임 */}
        <p className="mt-2 text-xs text-muted-foreground">
          {role === "seller" ? "구매자" : "판매자"}: {counterpartNickname}
        </p>

        <Separator className="my-3" />

        {/* 액션 영역 (Client) — 거래완료/낙찰 포기/상품 내리기/평점 인터랙션 */}
        <TransactionActions
          transaction={transaction}
          role={role}
          counterpartNickname={counterpartNickname}
          chatRoomId={chatRoomId}
          statusLabels={statusLabels}
        />
      </CardContent>
    </Card>
  );
}
