// 패널티/이용 제한 상태 조회 (Server Component 용)
// ISSUE-004: 최근 penalty_window_days 이내 누적 패널티가 임계값 이상이면 경매 등록이 제한된다.
// 이 조회는 UX 사전검증용(등록 폼 비활성/안내)이며, 최종 강제는 서버 트리거
// enforce_seller_penalty_limit 가 products insert 시 codes.policy 를 직접 조회해 수행한다.

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "./profiles";
import { fetchPolicies } from "./codes";

/** 현재 사용자의 패널티 누적 상태 */
export interface PenaltyStatus {
  /** 집계 기간(windowDays) 이내 누적 패널티 수 */
  count: number;
  /** 이용 제한 임계값(회) */
  threshold: number;
  /** 누적 집계 기간(일) */
  windowDays: number;
  /** 경매 등록 제한 여부 (count >= threshold) */
  restricted: boolean;
}

/**
 * 현재 로그인 사용자의 패널티 누적 상태를 조회한다.
 * 비로그인 시 제한 없음(0건)으로 반환한다(등록 진입은 미들웨어가 별도 차단).
 */
export async function fetchMyPenaltyStatus(): Promise<PenaltyStatus> {
  const policies = await fetchPolicies();
  const threshold = policies.penalty_restriction_threshold;
  const windowDays = policies.penalty_window_days;

  const userId = await getCurrentUserId();
  if (!userId) {
    return { count: 0, threshold, windowDays, restricted: false };
  }

  const supabase = await createClient();
  // rolling window 시작 시각 (DB 트리거의 now() - windowDays 와 동일 기준)
  const windowStart = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // RLS(본인 조회)로 자신의 패널티만 카운트된다. head:true 로 행 없이 개수만 조회.
  const { count, error } = await supabase
    .from("penalties")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("created_at", windowStart);

  const penaltyCount = error ? 0 : (count ?? 0);
  return {
    count: penaltyCount,
    threshold,
    windowDays,
    restricted: penaltyCount >= threshold,
  };
}
