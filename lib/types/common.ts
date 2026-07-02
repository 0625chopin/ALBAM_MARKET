// 공통코드/옵션 도메인 타입
// DB code_groups/codes 테이블과 UI(셀렉트·라디오) 바인딩을 잇는 공용 계약이다.
// Mock(lib/constants 시드)과 실제 DB(lib/queries/codes) 조회가 동일 타입을 공유한다.

/** 옵션 항목 공통 형태 (셀렉트/라디오 등 UI 바인딩용) */
export interface SelectOption {
  /** 저장/식별 값 (DB codes.code, 예: "good", "seoul") */
  value: string;
  /** 화면 표시 라벨 (DB codes.label, 예: "사용감 적음", "서울") */
  label: string;
}

/** 공통코드 그룹 키 (DB code_groups.group_key) */
export type CodeGroupKey =
  | "product_condition"
  | "category"
  | "region"
  | "auction_duration"
  | "product_status"
  | "transaction_status"
  | "policy";

/** 정책 코드 키 (DB codes.code where group_key = 'policy') */
export type PolicyKey =
  | "default_auction_duration_hours"
  | "min_bid_increment"
  | "auto_complete_wait_hours"
  | "penalty_restriction_threshold"
  | "penalty_window_days";

/** 정책 키 → 수치 맵 */
export type PolicyMap = Record<PolicyKey, number>;
