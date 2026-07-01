// 회원(프로필) 도메인 타입
// PRD 데이터 모델 profiles 테이블을 camelCase로 1:1 매핑한다.
// Mock 데이터와 실제 DB 데이터가 공유하는 단일 계약(contract)이다.

/**
 * 회원 프로필 (판매자/구매자 권한 공동 보유, 역할별 평판 보유)
 * - PRD: profiles
 */
export interface Profile {
  /** 고유 식별자 (auth 사용자 UUID) */
  id: string;
  /** 닉네임 */
  nickname: string;
  /** 직거래 기본 지역 */
  region: string;
  /** 아바타 이미지 URL */
  avatarUrl: string | null;
  /** 판매자 레벨 (거래 건수 + 별점 기반) */
  sellerLevel: number;
  /** 구매자 레벨 (거래 건수 + 별점 기반) */
  buyerLevel: number;
}
