// 표시용 포맷 유틸 (순수 함수)
// Mock/실데이터 공통 사용. 컴포넌트는 이 유틸로 표시 문자열을 만든다.

/** 가격을 한국 원화 표기로 변환 (예: 15000 → "15,000원") */
export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

/**
 * 마감 시각까지 남은 시간을 사람이 읽는 문자열로 변환.
 * 이미 지났으면 "마감". (라이브 카운트다운은 Phase 3에서 추가)
 */
export function formatRemainingTime(
  endsAt: string,
  now: Date = new Date()
): string {
  const diffMs = new Date(endsAt).getTime() - now.getTime();
  if (diffMs <= 0) return "마감";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

/** 별점(0~max)을 소수 첫째 자리 문자열로 변환 (예: 8.5) */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/** 레벨 숫자를 라벨로 변환 (예: 3 → "Lv.3") */
export function levelLabel(level: number): string {
  return `Lv.${level}`;
}

/** ISO 시각을 HH:MM(24시간) 문자열로 변환 (채팅 메시지 시각 등) */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
