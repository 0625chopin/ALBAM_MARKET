// 상태 배지 컴포넌트 (RSC)
// 경매 상품 상태(ProductStatus) 또는 거래 상태(TransactionStatus)를
// kind prop으로 구분하여 알맞은 한글 라벨과 Badge variant를 렌더한다.

import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
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

// 표시 라벨(label)은 DB 공통코드(codes)에서 조회한 값을 호출부가 주입한다(단일 소스, 무폴백).
// 상태→variant(색상) 매핑만 UI 로직이라 이 컴포넌트가 코드로 유지한다.

/** 경매 상품 상태 배지 props */
interface ProductStatusBadgeProps {
  kind: "product";
  status: ProductStatus;
  /** 표시 라벨 (codes.product_status label 주입) */
  label: string;
}

/** 거래 상태 배지 props */
interface TransactionStatusBadgeProps {
  kind: "transaction";
  status: TransactionStatus;
  /** 표시 라벨 (codes.transaction_status label 주입) */
  label: string;
}

type StatusBadgeProps = ProductStatusBadgeProps | TransactionStatusBadgeProps;

export function StatusBadge(props: StatusBadgeProps) {
  const variant =
    props.kind === "product"
      ? PRODUCT_STATUS_VARIANT[props.status]
      : TRANSACTION_STATUS_VARIANT[props.status];
  return <Badge variant={variant}>{props.label}</Badge>;
}
