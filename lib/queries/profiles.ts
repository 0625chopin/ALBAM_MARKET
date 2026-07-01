// 프로필/세션 조회 (Server Component / Server Action / Route Handler 용)
// Mock(lib/mocks/profiles)과 동일한 도메인 계약을 반환한다. 페이지는 이 함수만 호출하고
// 컴포넌트는 수정하지 않는다(UI 무수정 원칙).

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { toProfile } from "./_map";

// 프로필 조회 시 공통으로 가져올 컬럼 (도메인 Profile 매핑에 필요한 최소 집합)
const PROFILE_COLUMNS =
  "id, nickname, region, avatar_url, seller_level, buyer_level";

/**
 * 현재 로그인 사용자 ID(auth UUID)를 반환한다. 비로그인 시 null.
 * 미들웨어(proxy.ts)와 동일하게 JWT 클레임(getClaims)에서 sub를 추출한다.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

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
