// 경매 등록/수정 폼 공용 유틸
// auction-form.tsx(등록)와 auction-edit-form.tsx(수정)가 각자 동일한 로직을 복제해 두면
// 정책이 바뀔 때 한쪽만 수정되는 사고가 나기 쉬워 순수 포맷 함수/상수만 이 파일로 추출한다.
// bid-panel.tsx의 입찰가 입력도 동일한 콤마 포맷 규칙을 쓰므로 함께 재사용한다.
// 폼별 상태 관리·마크업·검증 로직은 각 컴포넌트에 그대로 둔다(동작 변경 없음).

/** 상품 이미지 최대 등록 개수 (대표 1 + 추가 5) — 등록 폼과 수정 폼이 동일한 값을 공유한다. */
export const IMAGE_SLOT_COUNT = 6;

/** 입력 문자열에서 숫자만 남긴다 (콤마·공백 등 제거) */
export const onlyDigits = (value: string) => value.replace(/[^\d]/g, "");

/** 숫자 문자열을 3자리마다 콤마 찍어 표시용으로 변환 (빈 값이면 빈 문자열) */
export const formatWithComma = (digits: string) =>
  digits === "" ? "" : Number(digits).toLocaleString("ko-KR");
