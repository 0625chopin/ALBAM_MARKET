// 알밤마켓 도메인 상수
// 미결정 정책(ISSUES.md)은 임시 상수로 관리하며, 추후 DB 정책값으로 이관한다.
// 각 상수에 관련 ISSUE 번호를 주석으로 명시한다.

import type { ProductStatus, TransactionStatus } from "@/lib/types";

/**
 * 기본 경매 진행 시간(시간 단위). auction_ends_at = 등록 시각 + 36시간.
 * 🟡 ISSUE-001: 현재는 상수, 추후 설정 테이블/카테고리별 정책으로 DB 이관 예정.
 */
export const DEFAULT_AUCTION_DURATION_HOURS = 36;

/**
 * 최소 입찰 증가폭(원). 입찰가는 현재가 + 이 값 이상이어야 한다.
 * 🔴 ISSUE-003: 정액/정률/구간별 정책 미결정 → 임시 정액. 정책 확정 시 검증식만 교체.
 */
export const MIN_BID_INCREMENT = 1000;

/**
 * 거래완료 자동완료 대기 시간(시간 단위). 구매자 미클릭 시 경과 후 자동완료.
 * 🔴 ISSUE-002: 값 미결정 → 임시값(72시간 = 3일). 확정 후 DB 정책값으로 이관.
 */
export const AUTO_COMPLETE_WAIT_HOURS = 72;

/** 옵션 항목 공통 형태 (셀렉트/라디오 등 UI 바인딩용) */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 중고등급(상품 상태) 옵션.
 * Product.condition 값으로 사용한다.
 */
export const PRODUCT_CONDITIONS: SelectOption[] = [
  { value: "new", label: "새상품(미개봉)" },
  { value: "like_new", label: "사용감 없음" },
  { value: "good", label: "사용감 적음" },
  { value: "fair", label: "사용감 많음" },
  { value: "poor", label: "고장/부분 손상" },
];

/**
 * 카테고리 옵션 (Mock 단계 임시 목록).
 * Phase 4에서 categories 테이블로 이관 예정.
 */
export const CATEGORY_OPTIONS: SelectOption[] = [
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

/**
 * 직거래 지역 옵션 (Mock 단계 임시 목록, 시·도 단위).
 */
export const REGION_OPTIONS: SelectOption[] = [
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

/**
 * 경매 상태 → 한글 라벨 맵. 배지/필터 등 표시에 사용.
 */
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "경매중",
  won: "낙찰",
  failed: "유찰",
  withdrawn: "내림",
  completed: "완료",
};

/**
 * 거래 상태 → 한글 라벨 맵. 배지/필터 등 표시에 사용.
 */
export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: "진행중",
  completed: "거래완료",
  auto_completed: "자동완료",
  canceled: "취소",
};
