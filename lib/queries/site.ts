// 사이트 전역 카운터 조회 (Server Component 용)
// site_counters 테이블 → 누적 방문 수 등. 표시용 현재값만 읽고, 증가는 클라이언트에서 RPC로 수행한다.
// 캐싱하지 않는다: 방문 수는 계속 변하므로 요청마다 최신값을 읽는다(공통코드와 다른 성격).

import { createClient } from "@0625chopin/shared/supabase/server";

/** 사이트 카운터 key (DB increment_site_counter 화이트리스트와 일치해야 함) */
export type SiteCounterKey = "home_visits";

/**
 * 사이트 카운터 현재값.
 * 조회 실패/행 없음이면 0 을 반환한다(표시 전용이라 무폴백 예외 대신 degrade).
 */
export async function fetchSiteCounter(key: SiteCounterKey): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_counters")
    .select("count")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return 0;
  return Number(data.count);
}
