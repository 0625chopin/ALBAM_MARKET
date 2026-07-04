// 거래 조회 (Server Component 용)
// 현재 사용자가 판매자 또는 구매자로 참여한 거래를 상품/상대/채팅방 정보와 함께 반환한다.

import { createClient } from "@0625chopin/shared/supabase/server";
import type { Product, Transaction } from "@0625chopin/shared/types";
import { toProduct, toTransaction } from "@0625chopin/shared/queries/map";
import { getCurrentUserId } from "./profiles";

const DEFAULT_NICKNAME = "이름 없음";

/** 거래 카드 렌더에 필요한 묶음(거래 + 상품 + 역할 + 상대 + 채팅방) */
export interface UserTransactionItem {
  transaction: Transaction;
  product: Product;
  /** 상품 대표 이미지 URL (없으면 null) */
  primaryImageUrl: string | null;
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
       products(*, product_images(url, is_primary)),
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

      // 대표 이미지 추출: is_primary 우선, 없으면 첫 번째
      const images = row.products!.product_images ?? [];
      const primary = images.find((img) => img.is_primary) ?? images[0];
      const primaryImageUrl = primary?.url ? primary.url : null;

      return {
        transaction: toTransaction(row),
        product: toProduct(row.products!),
        primaryImageUrl,
        role,
        counterpartNickname,
        chatRoomId,
      };
    });
}
