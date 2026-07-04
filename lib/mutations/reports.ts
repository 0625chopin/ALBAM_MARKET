// 신고 접수 (Client Component 용, FA050)
// 사용자가 상품/사용자/메시지/평점을 신고한다. reports insert 는 RLS(reports_insert_own)로
// 신고자 본인(reporter_id = auth.uid())만 허용된다. 조회/처리는 관리자 전용.

import { createClient } from "@0625chopin/shared/supabase/client";
import type { ReportTargetType } from "@0625chopin/shared/types";

export interface SubmitReportInput {
  /** 신고 대상 유형 (product/user/message/rating) */
  targetType: ReportTargetType;
  /** 신고 대상 식별자 */
  targetId: string;
  /** 신고 사유 코드 (REPORT_REASON_LABEL 의 키) */
  reason: string;
  /** 상세 설명 (선택) */
  detail?: string | null;
}

/**
 * 신고를 접수한다(reports insert). 로그인 필수.
 * 동일 대상에 대한 대기(pending) 신고가 이미 있으면(부분 UNIQUE 인덱스 위반) 안내 메시지로 변환한다.
 */
export async function submitReport(input: SubmitReportInput): Promise<void> {
  const supabase = createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("로그인이 필요합니다.");

  const { targetType, targetId, reason, detail } = input;
  if (!reason) throw new Error("신고 사유를 선택해 주세요.");

  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    target_type: targetType,
    target_id: targetId,
    reason,
    detail: detail?.trim() ? detail.trim() : null,
  });

  if (error) {
    // 23505: 동일 신고자·대상의 pending 신고 중복(reports_unique_pending)
    if (error.code === "23505") {
      throw new Error("이미 접수된 신고가 처리 대기 중입니다.");
    }
    throw new Error(error.message ?? "신고 접수에 실패했습니다.");
  }
}
