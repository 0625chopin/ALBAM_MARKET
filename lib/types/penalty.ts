// 패널티 도메인 타입
// PRD 데이터 모델 penalties 테이블을 camelCase로 1:1 매핑한다.

/**
 * 패널티 (낙찰 포기/위반 기록)
 * - PRD: penalties
 */
export interface Penalty {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 대상 회원 (profiles.id) */
  userId: string;
  /** 사유 (abandon/withdraw 등) */
  reason: string;
  /** 발생 시각 (ISO 8601) */
  createdAt: string;
}
