// 프로필/세션 조회 (Server Component / Server Action / Route Handler 용)
// Mock(lib/mocks/profiles)과 동일한 도메인 계약을 반환한다. 페이지는 이 함수만 호출하고
// 컴포넌트는 수정하지 않는다(UI 무수정 원칙).

import { cache } from "react";
import { createClient } from "@0625chopin/shared/supabase/server";
import type { Profile } from "@0625chopin/shared/types";
import { toProfile } from "@0625chopin/shared/queries/map";

// 프로필 조회 시 공통으로 가져올 컬럼 (도메인 Profile 매핑에 필요한 최소 집합)
const PROFILE_COLUMNS =
  "id, nickname, region, avatar_url, seller_level, buyer_level";

/**
 * 현재 로그인 사용자 ID(auth UUID)를 반환한다. 비로그인 시 null.
 * 미들웨어(proxy.ts)와 동일하게 JWT 클레임(getClaims)에서 sub를 추출한다.
 *
 * ISSUE-033 P2: React `cache()`로 감싸 "요청 단위"로 결과를 dedupe한다.
 * 이 함수는 fetchMyBidCount/fetchCurrentProfile/여러 페이지에서 각각 독립적으로
 * 호출되는데(예: app/auctions/[id]/page.tsx 의 Promise.all 병렬 조회 중 하나이면서
 * 동시에 fetchMyBidCount 내부에서도 호출됨), cache() 없이 병렬화하면 동일 요청 안에서
 * getClaims() 가 중복 실행된다. 인자가 없는 함수라 cache 키가 항상 동일하므로,
 * 같은 요청 내 첫 호출의 진행 중인 Promise를 이후 호출들이 그대로 재사용한다.
 * (대안으로 호출부마다 userId를 매개변수로 전달하는 방법도 있었지만, 이 함수를
 * 호출하는 지점이 여러 쿼리 파일/페이지에 흩어져 있어 시그니처를 모두 바꾸는 것보다
 * 단일 지점(이 파일)에서 dedupe하는 편이 변경 범위가 훨씬 작다.)
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

/** id(UUID)로 프로필 조회. 없으면 null. */
export async function fetchProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toProfile(data);
}

/** 현재 로그인 사용자의 프로필 조회. 비로그인 또는 미존재 시 null. */
export async function fetchCurrentProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return fetchProfile(userId);
}

/** 역할별 평균 별점 (profile_reputation 뷰 기반). 평가가 없으면 0. */
export interface ProfileScores {
  sellerAvgScore: number;
  buyerAvgScore: number;
}

/** id(UUID)의 판매자/구매자 평균 별점을 조회한다. */
export async function fetchProfileScores(id: string): Promise<ProfileScores> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_reputation")
    .select("seller_avg_score, buyer_avg_score")
    .eq("profile_id", id)
    .maybeSingle();
  return {
    sellerAvgScore: data?.seller_avg_score ?? 0,
    buyerAvgScore: data?.buyer_avg_score ?? 0,
  };
}
