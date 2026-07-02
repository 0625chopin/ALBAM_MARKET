// DB Row(snake_case) → 도메인 타입(camelCase) 변환 어댑터 모음 (ISSUE-012)
// UI 컴포넌트는 @/lib/types 의 camelCase 계약만 사용하므로, 모든 Supabase 조회 결과는
// 이 파일의 매퍼를 거쳐 도메인 타입으로 변환한다. Mock(lib/mocks)과 동일한 계약을 보장한다.

import type { Tables } from "@/lib/database.types";
import type {
  Profile,
  AuctionSummary,
  AuctionDetail,
  ProductImage,
  ProductStatus,
  SellerReputation,
  Product,
  Transaction,
  TransactionStatus,
  Message,
  SelectOption,
} from "@/lib/types";

// region/nickname 미설정(NULL) 시 표시용 기본값
const DEFAULT_NICKNAME = "이름 없음";
const DEFAULT_REGION = "지역 미설정";

/** DB profiles Row → 도메인 Profile */
export function toProfile(
  row: Pick<
    Tables<"profiles">,
    "id" | "nickname" | "region" | "avatar_url" | "seller_level" | "buyer_level"
  >
): Profile {
  return {
    id: row.id,
    nickname: row.nickname ?? DEFAULT_NICKNAME,
    region: row.region ?? DEFAULT_REGION,
    avatarUrl: row.avatar_url,
    sellerLevel: row.seller_level,
    buyerLevel: row.buyer_level,
  };
}

// ===== 경매(상품) 매퍼 =====

// 카드 요약 쿼리가 반환하는 product_images 임베드(부분) 형태
interface SummaryImageEmbed {
  url: string;
  is_primary: boolean;
}

/** DB products Row(+대표 이미지 임베드) → 카드 요약 AuctionSummary */
export function toAuctionSummary(
  row: Pick<
    Tables<"products">,
    | "id"
    | "title"
    | "start_price"
    | "current_price"
    | "auction_ends_at"
    | "status"
    | "region"
  > & { product_images: SummaryImageEmbed[] },
  statusLabel: string
): AuctionSummary {
  const images = row.product_images ?? [];
  const primary = images.find((img) => img.is_primary) ?? images[0];
  return {
    id: row.id,
    title: row.title,
    primaryImageUrl: primary?.url ? primary.url : null,
    startPrice: row.start_price,
    currentPrice: row.current_price,
    auctionEndsAt: row.auction_ends_at,
    status: row.status as ProductStatus,
    statusLabel,
    region: row.region,
  };
}

/** DB product_images Row → 도메인 ProductImage */
export function toProductImage(
  row: Pick<
    Tables<"product_images">,
    "id" | "product_id" | "url" | "is_primary"
  >
): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url,
    isPrimary: row.is_primary,
  };
}

/** DB codes Row → UI 옵션 SelectOption (value=code, label=label) */
export function toSelectOption(
  row: Pick<Tables<"codes">, "code" | "label">
): SelectOption {
  return { value: row.code, label: row.label };
}

/** DB profiles Row + 평균 별점 → 판매자 평판 요약 */
// nickname/region 은 매퍼가 기본값으로 방어하므로 nullable 을 허용한다(프로필 미존재 폴백 대응).
export function toSellerReputation(
  profile: {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
    region: string | null;
    seller_level: number;
  },
  sellerAvgScore: number
): SellerReputation {
  return {
    id: profile.id,
    nickname: profile.nickname ?? DEFAULT_NICKNAME,
    avatarUrl: profile.avatar_url,
    region: profile.region ?? DEFAULT_REGION,
    sellerLevel: profile.seller_level,
    sellerAvgScore,
  };
}

/** DB products Row → 도메인 Product */
export function toProduct(row: Tables<"products">): Product {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description,
    category: row.category,
    condition: row.condition,
    region: row.region,
    startPrice: row.start_price,
    buyNowPrice: row.buy_now_price,
    currentPrice: row.current_price,
    status: row.status as ProductStatus,
    auctionEndsAt: row.auction_ends_at,
    winnerId: row.winner_id,
  };
}

/** DB transactions Row → 도메인 Transaction */
export function toTransaction(row: Tables<"transactions">): Transaction {
  return {
    id: row.id,
    productId: row.product_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    finalPrice: row.final_price,
    status: row.status as TransactionStatus,
  };
}

/** DB messages Row → 도메인 Message */
export function toMessage(
  row: Pick<
    Tables<"messages">,
    "id" | "room_id" | "sender_id" | "content" | "created_at"
  >
): Message {
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

/** 상품 본문 + 이미지/카테고리·상태·등급 라벨/판매자/입찰수 → 경매 상세 AuctionDetail */
export function toAuctionDetail(args: {
  product: Tables<"products">;
  images: Pick<
    Tables<"product_images">,
    "id" | "product_id" | "url" | "is_primary"
  >[];
  categoryLabel: string;
  statusLabel: string;
  conditionLabel: string;
  seller: SellerReputation;
  bidCount: number;
}): AuctionDetail {
  const {
    product,
    images,
    categoryLabel,
    statusLabel,
    conditionLabel,
    seller,
    bidCount,
  } = args;
  return {
    id: product.id,
    sellerId: product.seller_id,
    title: product.title,
    description: product.description,
    category: product.category,
    condition: product.condition,
    region: product.region,
    startPrice: product.start_price,
    buyNowPrice: product.buy_now_price,
    currentPrice: product.current_price,
    status: product.status as ProductStatus,
    auctionEndsAt: product.auction_ends_at,
    winnerId: product.winner_id,
    images: images.map(toProductImage),
    categoryLabel,
    statusLabel,
    conditionLabel,
    seller,
    bidCount,
  };
}
