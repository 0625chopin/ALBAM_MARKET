// 별점/평점 도메인 타입
// PRD 데이터 모델 ratings 테이블을 camelCase로 1:1 매핑한다.

/**
 * 평가 역할
 * - as_seller: 판매자로서 받은 평가 / as_buyer: 구매자로서 받은 평가
 */
export type RatingRole = "as_seller" | "as_buyer";

/**
 * 별점/평점 (거래완료 후 상호 부여, 거래당 1회)
 * - PRD: ratings
 */
export interface Rating {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 대상 거래 (transactions.id) */
  transactionId: string;
  /** 평가자 (profiles.id) */
  raterId: string;
  /** 피평가자 (profiles.id) */
  rateeId: string;
  /** 평가 역할 */
  role: RatingRole;
  /** 별점 (1~10) */
  score: number;
}
