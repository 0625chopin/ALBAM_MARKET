// 공통코드 조회 (Client Component 용)
// 서버용 lib/queries/codes.ts 와 분리(브라우저 클라이언트 사용). codes 테이블은 공개 SELECT(anon/authenticated).
// 신고 사유(report_reason)처럼 클라이언트 컴포넌트(ReportDialog)에서 필요한 옵션을 직접 조회한다.

import { createClient } from "@0625chopin/shared/supabase/client";
import type { SelectOption } from "@0625chopin/shared/types";
import { toSelectOption } from "@0625chopin/shared/queries/map";

// 모듈 단위 캐시(브라우저 세션): 신고 다이얼로그가 여러 개여도 최초 1회만 조회하고 재사용한다.
// 실패/빈 결과는 캐시하지 않아 다음 호출에서 재조회한다.
let reportReasonCache: Promise<SelectOption[]> | null = null;

/**
 * 신고 사유 옵션 목록 (공통코드 codes.report_reason → SelectOption, 활성만, sort_order 오름차순).
 * value = 사유 코드(reports.reason 저장값), label = 화면 표시.
 */
export function fetchReportReasonOptions(): Promise<SelectOption[]> {
  if (reportReasonCache) return reportReasonCache;

  reportReasonCache = (async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("codes")
      .select("code, label")
      .eq("group_key", "report_reason")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) {
      reportReasonCache = null; // 무폴백: 실패는 캐시하지 않음
      return [];
    }
    return data.map(toSelectOption);
  })();

  return reportReasonCache;
}
