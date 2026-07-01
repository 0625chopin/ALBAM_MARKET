// 거래 도메인 타입
// PRD 데이터 모델 transactions 테이블을 camelCase로 1:1 매핑한다.

/**
 * 거래 상태
 * - pending: 진행중 / completed: 거래완료 / auto_completed: 자동완료 / canceled: 취소(낙찰 포기 등)
 */
export type TransactionStatus =
  "pending" | "completed" | "auto_completed" | "canceled";

/**
 * 거래
 * - PRD: transactions
 */
export interface Transaction {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 대상 상품 (products.id) */
  productId: string;
  /** 판매자 (profiles.id) */
  sellerId: string;
  /** 구매자(현재 낙찰자, profiles.id) */
  buyerId: string;
  /** 확정 거래가 */
  finalPrice: number;
  /** 거래 상태 */
  status: TransactionStatus;
}
