// 거래 조회 (Server Component 용)
// 현재 사용자가 판매자 또는 구매자로 참여한 거래를 상품/상대/채팅방 정보와 함께 반환한다.

import { createClient } from "@/lib/supabase/server";
import type { Product, Transaction } from "@/lib/types";
import { toProduct, toTransaction } from "./_map";
import { getCurrentUserId } from "./profiles";

const DEFAULT_NICKNAME = "이름 없음";

/** 거래 카드 렌더에 필요한 묶음(거래 + 상품 + 역할 + 상대 + 채팅방) */
export interface UserTransactionItem {
  transaction: Transaction;
  product: Product;
  role: "seller" | "buyer";
  counterpartNickname: string;
  chatRoomId: string | null;
}

/** 현재 사용자의 거래 목록 (최신순). 비로그인 시 빈 배열. */
export async function fetchUserTransactions(): Promise<UserTransactionItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `*,
       products(*),
       chat_rooms(id),
       seller:profiles!transactions_seller_id_fkey(nickname),
       buyer:profiles!transactions_buyer_id_fkey(nickname)`
    )
    .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => row.products !== null)
    .map((row) => {
      const role: "seller" | "buyer" =
        row.seller_id === userId ? "seller" : "buyer";
      const counterpartNickname =
        (role === "seller" ? row.buyer?.nickname : row.seller?.nickname) ??
        DEFAULT_NICKNAME;
      // chat_rooms 는 거래당 1개(unique) → 단일 객체로 임베드됨
      const chatRoomId = row.chat_rooms?.id ?? null;

      return {
        transaction: toTransaction(row),
        product: toProduct(row.products!),
        role,
        counterpartNickname,
        chatRoomId,
      };
    });
}
