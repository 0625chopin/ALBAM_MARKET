// 채팅 메시지 전송 (Client Component 용)

import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { toMessage } from "@/lib/queries/_map";

/**
 * 메시지를 전송한다(messages insert). 당사자가 아니면 RLS 로 차단된다.
 * 삽입된 행(서버 확정 id/created_at)을 도메인 Message 로 반환한다.
 */
export async function sendMessage(
  roomId: string,
  content: string
): Promise<Message> {
  const supabase = createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("messages")
    .insert({ room_id: roomId, sender_id: userId, content })
    .select("id, room_id, sender_id, content, created_at")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "메시지 전송에 실패했습니다.");
  }
  return toMessage(data);
}
