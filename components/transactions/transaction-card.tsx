// 거래 카드 컴포넌트 (RSC)
// 거래 목록에서 각 거래의 요약 정보를 표시한다.
// 액션 영역(거래완료·낙찰 포기·상품 내리기·평점)은 클라이언트 인터랙션이 필요하므로
// components/transactions/transaction-actions.tsx(Client)로 분리했다. 카드 본문은 RSC 유지.
import { Badge } from "@0625chopin/shared/ui/badge";
import { Card, CardContent } from "@0625chopin/shared/ui/card";
import { Separator } from "@0625chopin/shared/ui/separator";
import { ImagePlaceholder } from "@0625chopin/shared/common/image-placeholder";
import { ProductImage } from "@0625chopin/shared/common/product-image";
import { StatusBadge } from "@0625chopin/shared/common/status-badge";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { formatPrice } from "@0625chopin/shared/format";
import type {
  Transaction,
  Product,
  ProductStatus,
  TransactionStatus,
} from "@0625chopin/shared/types";

interface TransactionCardProps {
  /** 거래 데이터 */
  transaction: Transaction;
  /** 거래 대상 상품 */
  product: Product;
  /** 상품 대표 이미지 URL (없으면 null) */
  primaryImageUrl: string | null;
  /** 현재 사용자의 역할 (판매자 | 구매자) */
  role: "seller" | "buyer";
  /** 거래 상대방 닉네임 */
  counterpartNickname: string;
  /** 연결된 채팅방 id (없으면 null) */
  chatRoomId: string | null;
  /** 거래 상태 라벨 맵 value→label (DB 공통코드 codes.transaction_status 주입) */
  statusLabels: Record<TransactionStatus, string>;
  /** 상품 상태 라벨 맵 value→label (DB 공통코드 codes.product_status 주입) — 유찰 표시용 */
  productStatusLabels: Record<ProductStatus, string>;
}

export function TransactionCard({
  transaction,
  product,
  primaryImageUrl,
  role,
  counterpartNickname,
  chatRoomId,
  statusLabels,
  productStatusLabels,
}: TransactionCardProps) {
  // 경매가 유찰(failed)/강제종료(force_closed)이면 거래 상태(취소) 대신 상품 상태('유찰'/'강제종료')를 표시한다.
  // 낙찰 포기(차순위 없음)→유찰, 관리자 경매 강제 종료→강제종료 등 판매 미성립 건의 결과를 명확히 보여준다.
  const isSaleNotEstablished =
    product.status === "failed" || product.status === "force_closed";
  return (
    <Card>
      <CardContent className="p-4">
        {/* 상품 정보 영역 */}
        <div className="flex gap-3">
          {/* 상품 대표 이미지 (작은 썸네일) — 있으면 실제 이미지(로드 실패 시 폴백), 없으면 placeholder */}
          {primaryImageUrl ? (
            <ProductImage
              src={primaryImageUrl}
              alt={`${product.title} 상품 이미지`}
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-md object-cover"
              placeholderClassName="size-16 shrink-0 rounded-md"
            />
          ) : (
            <ImagePlaceholder
              className="size-16 shrink-0 rounded-md"
              label={`${product.title} 상품 이미지`}
            />
          )}

          {/* 상품 제목 및 배지 묶음 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 상품 제목 */}
            <p className="text-foreground truncate text-sm font-semibold">
              {product.title}
            </p>

            {/* 역할·상태 배지 행 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 역할 배지: 판매 / 구매(판매 미성립 시 '낙찰' 표기 제거) */}
              <Badge variant="outline" className="text-xs">
                {role === "seller"
                  ? "판매"
                  : isSaleNotEstablished
                    ? "구매"
                    : "낙찰(구매)"}
              </Badge>
              {/* 상태 배지: 유찰/강제종료면 상품 상태 배지, 아니면 거래 상태.
                  (액션 후 갱신 상태는 액션 영역에 별도 표시) */}
              {isSaleNotEstablished ? (
                <StatusBadge
                  kind="product"
                  status={product.status}
                  label={productStatusLabels[product.status]}
                />
              ) : (
                <StatusBadge
                  kind="transaction"
                  status={transaction.status}
                  label={statusLabels[transaction.status]}
                />
              )}
            </div>

            {/* 확정가 */}
            <p className="text-foreground text-sm font-bold">
              {formatPrice(transaction.finalPrice)}
            </p>
          </div>
        </div>

        {/* 상대방 닉네임 */}
        <p className="text-muted-foreground mt-2 text-xs">
          {role === "seller" ? "구매자" : "판매자"}: {counterpartNickname}
        </p>

        <Separator className="my-3" />

        {/* 액션 영역 (Client) — 거래완료/낙찰 포기/상품 내리기/평점 인터랙션 */}
        <TransactionActions
          transaction={transaction}
          productStatus={product.status}
          productTitle={product.title}
          role={role}
          counterpartNickname={counterpartNickname}
          chatRoomId={chatRoomId}
          statusLabels={statusLabels}
        />
      </CardContent>
    </Card>
  );
}
