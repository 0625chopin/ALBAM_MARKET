// Mock 공통코드 데이터
// lib/queries/codes.ts 와 동일한 시그니처를 제공해, 페이지가 import 한 줄만 바꿔
// 실데이터(@/lib/queries) ↔ Mock(@/lib/mocks) 을 교체할 수 있게 한다(컴포넌트 무수정).
// 라벨/옵션 + 정책 수치 시드 데이터를 이 파일이 자체 보유한다(운영 소스는 DB codes 테이블).

import type {
  SelectOption,
  CodeGroupKey,
  PolicyMap,
  ProductStatus,
  TransactionStatus,
} from "@/lib/types";

// ===== Mock 시드 (DB codes 테이블 초기 시드와 동일) =====

/** 중고등급(상품 상태) 옵션 — Product.condition value */
export const MOCK_PRODUCT_CONDITIONS: SelectOption[] = [
  { value: "new", label: "새상품(미개봉)" },
  { value: "like_new", label: "사용감 없음" },
  { value: "good", label: "사용감 적음" },
  { value: "fair", label: "사용감 많음" },
  { value: "poor", label: "고장/부분 손상" },
];

/** 카테고리 옵션 — value=코드(예: "digital"), label=표시명 */
export const MOCK_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "digital", label: "디지털기기" },
  { value: "appliance", label: "생활가전" },
  { value: "furniture", label: "가구/인테리어" },
  { value: "fashion", label: "의류/잡화" },
  { value: "beauty", label: "뷰티/미용" },
  { value: "sports", label: "스포츠/레저" },
  { value: "hobby", label: "취미/게임/음반" },
  { value: "book", label: "도서/티켓/문구" },
  { value: "baby", label: "유아동/출산" },
  { value: "etc", label: "기타 중고물품" },
];

/** 직거래 지역 옵션 (시·도 단위) */
export const MOCK_REGION_OPTIONS: SelectOption[] = [
  { value: "seoul", label: "서울" },
  { value: "gyeonggi", label: "경기" },
  { value: "incheon", label: "인천" },
  { value: "busan", label: "부산" },
  { value: "daegu", label: "대구" },
  { value: "daejeon", label: "대전" },
  { value: "gwangju", label: "광주" },
  { value: "ulsan", label: "울산" },
  { value: "sejong", label: "세종" },
  { value: "gangwon", label: "강원" },
  { value: "chungbuk", label: "충북" },
  { value: "chungnam", label: "충남" },
  { value: "jeonbuk", label: "전북" },
  { value: "jeonnam", label: "전남" },
  { value: "gyeongbuk", label: "경북" },
  { value: "gyeongnam", label: "경남" },
  { value: "jeju", label: "제주" },
];

/** 경매 진행 시간 옵션 — value=시간(hours) 문자열, label=표시명 (DB codes.auction_duration 시드와 동일) */
export const MOCK_AUCTION_DURATIONS: SelectOption[] = [
  { value: "12", label: "12시간" },
  { value: "24", label: "1일" },
  { value: "48", label: "2일" },
  { value: "72", label: "3일" },
  { value: "96", label: "4일" },
  { value: "120", label: "5일" },
  { value: "144", label: "6일" },
  { value: "168", label: "7일" },
];

/** 경매 상태 → 한글 라벨 맵 */
export const MOCK_PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "경매중",
  won: "낙찰",
  failed: "유찰",
  withdrawn: "내림",
  completed: "완료",
};

/** 거래 상태 → 한글 라벨 맵 */
export const MOCK_TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> =
  {
    pending: "진행중",
    completed: "거래완료",
    auto_completed: "자동완료",
    canceled: "취소",
  };

function recordToOptions(rec: Record<string, string>): SelectOption[] {
  return Object.entries(rec).map(([value, label]) => ({ value, label }));
}

const CODE_GROUPS: Record<CodeGroupKey, SelectOption[]> = {
  product_condition: MOCK_PRODUCT_CONDITIONS,
  category: MOCK_CATEGORY_OPTIONS,
  region: MOCK_REGION_OPTIONS,
  auction_duration: MOCK_AUCTION_DURATIONS,
  product_status: recordToOptions(MOCK_PRODUCT_STATUS_LABELS),
  transaction_status: recordToOptions(MOCK_TRANSACTION_STATUS_LABELS),
  policy: [],
};

/** 공통코드 그룹 옵션 목록 (Mock) */
export async function fetchCodeGroup(
  groupKey: CodeGroupKey
): Promise<SelectOption[]> {
  return CODE_GROUPS[groupKey];
}

/** 상태 라벨 맵 value→label (Mock) */
export async function fetchStatusLabels(
  groupKey: "product_status" | "transaction_status"
): Promise<Record<string, string>> {
  const options = CODE_GROUPS[groupKey];
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

/** 카테고리 옵션 목록 (Mock) */
export async function fetchCategoryOptions(): Promise<SelectOption[]> {
  return MOCK_CATEGORY_OPTIONS;
}

/** 경매 진행 시간 옵션 목록 (Mock) */
export async function fetchAuctionDurationOptions(): Promise<SelectOption[]> {
  return MOCK_AUCTION_DURATIONS;
}

/** 정책 수치 맵 시드 (DB codes.policy 초기 시드와 동일) */
export const MOCK_POLICIES: PolicyMap = {
  default_auction_duration_hours: 36,
  min_bid_increment: 1000,
  auto_complete_wait_hours: 24,
  penalty_restriction_threshold: 3,
  penalty_window_days: 30,
};

/** 정책 수치 맵 (Mock) */
export async function fetchPolicies(): Promise<PolicyMap> {
  return { ...MOCK_POLICIES };
}
