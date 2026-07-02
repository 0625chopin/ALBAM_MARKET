// 공통코드 조회 (Server Component 용)
// code_groups/codes 테이블 → 도메인 SelectOption / 정책 맵.
// 캐싱: React cache()(요청 단위)가 아니라 "프로세스 단위" 모듈 싱글턴으로 캐싱한다.
//       서버 프로세스 기동 후 그룹별 최초 1회만 DB를 조회하고, 이후 모든 요청이 결과를 재사용한다.
//       (공통코드는 사실상 정적 참조 데이터라 요청마다 재조회할 필요가 없다.)
// 폴백: 전 그룹 DB 전용(무폴백). 라벨/옵션은 실패 시 빈 배열, 정책 수치는 실패/키 누락 시 예외를
//       던진다(숫자는 원문 degrade가 불가능하고 PolicyMap이 전 키를 요구하므로 명시적 실패). 실패는
//       캐시하지 않아 다음 요청에서 재조회한다.

import { createClient } from "@/lib/supabase/server";
import type {
  SelectOption,
  CodeGroupKey,
  PolicyMap,
  PolicyKey,
} from "@/lib/types";
import { toSelectOption } from "./_map";

/** 프로세스 단위 그룹 캐시 (그룹키 → 성공 조회 결과 Promise). 실패는 캐시하지 않는다. */
const groupCache = new Map<CodeGroupKey, Promise<SelectOption[]>>();

/**
 * 공통코드 그룹 옵션 목록 (활성만, sort_order 오름차순).
 * 프로세스당 그룹별 최초 1회만 DB 조회 후 재사용. 실패/빈 결과 시 빈 배열(무폴백)이며 캐시하지 않는다.
 */
export function fetchCodeGroup(
  groupKey: CodeGroupKey
): Promise<SelectOption[]> {
  const cached = groupCache.get(groupKey);
  if (cached) return cached;

  const promise = (async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("codes")
      .select("code, label")
      .eq("group_key", groupKey)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) {
      // 무폴백: 실패/빈 결과는 캐시에서 제거해 다음 요청에서 재조회하도록 한다.
      groupCache.delete(groupKey);
      return [];
    }
    return data.map(toSelectOption);
  })();

  groupCache.set(groupKey, promise);
  return promise;
}

/**
 * 상태 라벨 맵(value→label). 배지/필터 표시용.
 * product_status / transaction_status 그룹에만 사용한다.
 */
export async function fetchStatusLabels(
  groupKey: "product_status" | "transaction_status"
): Promise<Record<string, string>> {
  const options = await fetchCodeGroup(groupKey);
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

/**
 * 카테고리 옵션 목록 (공통코드 codes.category → SelectOption, value=코드).
 * 다른 공통코드 그룹과 동일하게 fetchCodeGroup 을 재사용한다.
 */
export function fetchCategoryOptions(): Promise<SelectOption[]> {
  return fetchCodeGroup("category");
}

/**
 * 경매 진행 시간 옵션 목록 (공통코드 codes.auction_duration → SelectOption, value=시간 문자열).
 * 다른 공통코드 그룹과 동일하게 fetchCodeGroup 을 재사용한다.
 * 프로세스당 최초 1회만 DB 조회 후 재사용(모듈 싱글턴).
 */
export function fetchAuctionDurationOptions(): Promise<SelectOption[]> {
  return fetchCodeGroup("auction_duration");
}

/** PolicyMap 이 요구하는 정책 키 전체 (DB codes.policy 에 모두 존재해야 함) */
const POLICY_KEYS: PolicyKey[] = [
  "default_auction_duration_hours",
  "min_bid_increment",
  "auto_complete_wait_hours",
  "penalty_restriction_threshold",
  "penalty_window_days",
];

/** 프로세스 단위 정책 캐시 (성공 조회 결과 Promise). 실패는 캐시하지 않는다. */
let policyCache: Promise<PolicyMap> | null = null;

/**
 * 정책 수치 맵(codes.policy). 클라이언트 UX 사전검증에 주입한다.
 * (최종 검증은 서버 RPC place_bid 등이 codes를 직접 조회해 수행 — 단일 소스)
 * 프로세스당 최초 1회만 DB 조회 후 재사용. 무폴백: 조회 실패/키 누락 시 예외를 던진다(캐시 안 함).
 */
export function fetchPolicies(): Promise<PolicyMap> {
  if (policyCache) return policyCache;

  const promise = (async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("codes")
      .select("code, num_value")
      .eq("group_key", "policy")
      .eq("is_active", true);
    if (error || !data) {
      policyCache = null; // 실패는 캐시하지 않음(다음 요청 재조회)
      throw new Error(
        `정책 공통코드(codes.policy) 조회 실패: ${error?.message ?? "데이터 없음"}`
      );
    }

    const map: Partial<PolicyMap> = {};
    for (const row of data) {
      if (
        row.num_value != null &&
        (POLICY_KEYS as string[]).includes(row.code)
      ) {
        map[row.code as PolicyKey] = Number(row.num_value);
      }
    }

    const missing = POLICY_KEYS.filter((key) => map[key] === undefined);
    if (missing.length > 0) {
      policyCache = null;
      throw new Error(
        `정책 공통코드(codes.policy) 누락: ${missing.join(", ")}`
      );
    }

    return map as PolicyMap;
  })();

  policyCache = promise;
  return promise;
}
