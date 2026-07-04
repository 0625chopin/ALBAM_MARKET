// 거래/낙찰 관련 클라이언트 변경(mutation) — Client Component 에서 호출한다.
// 서버 전용 lib/queries/* 와 분리(브라우저 클라이언트 사용).

import { createClient } from "@0625chopin/shared/supabase/client";

/**
 * 낙찰 포기 (원자적 RPC abandon_won_auction).
 * 차순위 입찰자에게 즉시 이양(거래/채팅방 생성), 차순위 없으면 유찰. 포기자 패널티 기록.
 */
export async function abandonAuction(productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("abandon_won_auction", {
    p_product_id: productId,
  });
  if (error) throw new Error(error.message);
}

/**
 * 거래완료 확정 (RPC complete_transaction). 구매자만, pending→completed.
 */
export async function completeTransaction(
  transactionId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("complete_transaction", {
    p_transaction_id: transactionId,
  });
  if (error) throw new Error(error.message);
}

/**
 * 거래 종료 (RPC end_transaction). 구매자만, 완료(completed/auto_completed) 거래.
 * transactions.ended_at 을 기록해 종료 상태를 공유 DB로 지속한다(멱등).
 */
export async function endTransaction(transactionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("end_transaction", {
    p_transaction_id: transactionId,
  });
  if (error) throw new Error(error.message);
}

/**
 * 상호 별점 제출 (RPC submit_rating). 거래 당사자만·완료 거래·거래당 1회.
 * 평가자 역할/상대는 서버가 거래에서 도출하고, 평가 후 상대 레벨을 재계산한다.
 * comment 는 선택값(ISSUE-016) — 미입력 시 null 로 전달한다.
 */
export async function submitRating(
  transactionId: string,
  score: number,
  comment: string | null = null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("submit_rating", {
    p_transaction_id: transactionId,
    p_score: score,
    // 생성 타입은 p_comment?: string 이므로 null 은 undefined 로 전달(미입력 시 RPC 기본값 null)
    p_comment: comment ?? undefined,
  });
  if (error) throw new Error(error.message);
}
