// 입찰 도메인 타입
// PRD 데이터 모델 bids 테이블을 camelCase로 1:1 매핑한다.

/**
 * 입찰 상태
 * - active: 유효 입찰 / won: 낙찰 / abandoned: 포기(낙찰 포기 등)
 */
export type BidStatus = "active" | "won" | "abandoned";

/**
 * 입찰
 * - PRD: bids
 */
export interface Bid {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 대상 상품 (products.id) */
  productId: string;
  /** 입찰자 (profiles.id) */
  bidderId: string;
  /** 입찰가 */
  amount: number;
  /** 입찰 상태 */
  status: BidStatus;
}
