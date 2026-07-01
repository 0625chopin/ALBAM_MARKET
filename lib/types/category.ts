// 카테고리 도메인 타입
// PRD 데이터 모델 categories 테이블을 camelCase로 1:1 매핑한다.

/**
 * 경매 상품 카테고리
 * - PRD: categories
 */
export interface Category {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 카테고리명 */
  name: string;
  /** 식별 슬러그 */
  slug: string;
}
