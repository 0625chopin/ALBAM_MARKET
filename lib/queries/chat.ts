// 채팅 조회 (Server Component 용)
// 채팅방은 거래 당사자(판매자/구매자)만 접근 가능하다(RLS + 함수 내 재확인).

import { createClient } from "@0625chopin/shared/supabase/server";
import type { Message } from "@0625chopin/shared/types";
import { toMessage } from "@0625chopin/shared/queries/map";
import { getCurrentUserId } from "./profiles";

const DEFAULT_NICKNAME = "이름 없음";

/** 채팅방 헤더 표시용 정보 (상대 닉네임·평점·내가 구매자 여부) */
export interface ChatRoomView {
  id: string;
  /** 연결된 거래 id (거래완료 버튼용) */
  transactionId: string;
  /** 상대방 사용자 id (사용자 신고 대상) */
  counterpartId: string;
  counterpartNickname: string;
  counterpartScore: number;
  /** 현재 사용자가 구매자인지 (거래완료 버튼 노출 조건) */
  isBuyer: boolean;
}

/** 채팅방 조회. 미존재 또는 당사자가 아니면 null. */
export async function fetchChatRoom(
  roomId: string
): Promise<ChatRoomView | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("chat_rooms")
    .select(
      "id, transaction_id, seller_id, buyer_id, transactions(status, products(status))"
    )
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return null;
  // 당사자 아님 → 접근 차단
  if (room.seller_id !== userId && room.buyer_id !== userId) return null;
  // 유찰(failed)/내림(withdrawn)/취소(canceled) → 거래 관계 해소, 채팅 차단
  const productStatus = room.transactions?.products?.status;
  if (
    room.transactions?.status === "canceled" ||
    productStatus === "failed" ||
    productStatus === "withdrawn"
  ) {
    return null;
  }

  const counterpartId =
    room.seller_id === userId ? room.buyer_id : room.seller_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", counterpartId)
    .maybeSingle();

  const { data: rep } = await supabase
    .from("profile_reputation")
    .select("seller_avg_score, buyer_avg_score")
    .eq("profile_id", counterpartId)
    .maybeSingle();

  const counterpartScore = rep?.seller_avg_score ?? rep?.buyer_avg_score ?? 0;

  return {
    id: room.id,
    transactionId: room.transaction_id,
    counterpartId,
    counterpartNickname: profile?.nickname ?? DEFAULT_NICKNAME,
    counterpartScore,
    isBuyer: room.buyer_id === userId,
  };
}

/** 채팅방 메시지 목록 (시간 오름차순). */
export async function fetchMessages(roomId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, room_id, sender_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return data.map(toMessage);
}
