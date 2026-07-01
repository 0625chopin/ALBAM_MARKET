// 상태 배지 컴포넌트 (RSC)
// 경매 상품 상태(ProductStatus) 또는 거래 상태(TransactionStatus)를
// kind prop으로 구분하여 알맞은 한글 라벨과 Badge variant를 렌더한다.

import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import {
  PRODUCT_STATUS_LABELS,
  TRANSACTION_STATUS_LABELS,
} from "@/lib/constants";
import type { ProductStatus, TransactionStatus } from "@/lib/types";

// Badge variant 타입 단축 별칭
type BadgeVariant = BadgeProps["variant"];

/** 경매 상품 상태 → Badge variant 매핑 */
const PRODUCT_STATUS_VARIANT: Record<ProductStatus, BadgeVariant> = {
  active: "default", // 경매중 — 주요 액션 색상
  won: "secondary", // 낙찰
  failed: "outline", // 유찰
  withdrawn: "outline", // 내림
  completed: "secondary", // 완료
};

/** 거래 상태 → Badge variant 매핑 */
const TRANSACTION_STATUS_VARIANT: Record<TransactionStatus, BadgeVariant> = {
  pending: "default", // 진행중
  completed: "secondary", // 거래완료
  auto_completed: "outline", // 자동완료
  canceled: "destructive", // 취소
};

/** 경매 상품 상태 배지 props */
interface ProductStatusBadgeProps {
  kind: "product";
  status: ProductStatus;
}

/** 거래 상태 배지 props */
interface TransactionStatusBadgeProps {
  kind: "transaction";
  status: TransactionStatus;
}

type StatusBadgeProps = ProductStatusBadgeProps | TransactionStatusBadgeProps;

export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === "product") {
    // 경매 상품 상태 배지
    const label = PRODUCT_STATUS_LABELS[props.status];
    const variant = PRODUCT_STATUS_VARIANT[props.status];
    return <Badge variant={variant}>{label}</Badge>;
  }

  // 거래 상태 배지
  const label = TRANSACTION_STATUS_LABELS[props.status];
  const variant = TRANSACTION_STATUS_VARIANT[props.status];
  return <Badge variant={variant}>{label}</Badge>;
}
