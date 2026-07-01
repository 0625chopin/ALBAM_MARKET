// Mock 경매 상품 데이터 + 이미지 + 파생 표시용 타입(AuctionSummary/AuctionDetail)
// 기준 현재 시각은 2026-06-29 (남은시간 표시가 의미 있도록 마감 시각을 전후로 배치)
import type {
  Product,
  ProductImage,
  AuctionSummary,
  AuctionDetail,
  SellerReputation,
} from "@/lib/types";
import { mockProfiles, getMockProfile } from "./profiles";
import { getMockCategory } from "./categories";

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    sellerId: "prof-2",
    title: "빈티지 가죽 자켓 (L 사이즈)",
    categoryId: "cat-fashion",
    condition: "good",
    region: "경기",
    startPrice: 20000,
    buyNowPrice: 80000,
    currentPrice: 35000,
    status: "active",
    auctionEndsAt: "2026-06-30T21:00:00+09:00",
    winnerId: null,
  },
  {
    id: "prod-2",
    sellerId: "prof-3",
    title: "아이폰 13 128GB 미드나이트",
    categoryId: "cat-digital",
    condition: "like_new",
    region: "서울",
    startPrice: 300000,
    buyNowPrice: 600000,
    currentPrice: 450000,
    status: "active",
    auctionEndsAt: "2026-07-01T12:30:00+09:00",
    winnerId: null,
  },
  {
    id: "prod-3",
    sellerId: "prof-4",
    title: "접이식 캠핑 의자 2개 세트",
    categoryId: "cat-sports",
    condition: "fair",
    region: "부산",
    startPrice: 10000,
    buyNowPrice: null,
    currentPrice: 18000,
    status: "active",
    auctionEndsAt: "2026-06-29T22:00:00+09:00",
    winnerId: null,
  },
  {
    id: "prod-4",
    sellerId: "prof-1",
    title: "원목 1인용 책상",
    categoryId: "cat-furniture",
    condition: "good",
    region: "서울",
    startPrice: 30000,
    buyNowPrice: null,
    currentPrice: 55000,
    status: "won",
    auctionEndsAt: "2026-06-28T20:00:00+09:00",
    winnerId: "prof-3",
  },
  {
    id: "prod-5",
    sellerId: "prof-2",
    title: "휴대용 게임 콘솔",
    categoryId: "cat-hobby",
    condition: "like_new",
    region: "경기",
    startPrice: 150000,
    buyNowPrice: 250000,
    currentPrice: 150000,
    status: "failed",
    auctionEndsAt: "2026-06-27T18:00:00+09:00",
    winnerId: null,
  },
  {
    id: "prod-6",
    sellerId: "prof-3",
    title: "유아 카시트 (신생아~4세)",
    categoryId: "cat-baby",
    condition: "good",
    region: "인천",
    startPrice: 40000,
    buyNowPrice: null,
    currentPrice: 40000,
    status: "withdrawn",
    auctionEndsAt: "2026-06-30T10:00:00+09:00",
    winnerId: null,
  },
];

// 상품 이미지 (url은 빈 문자열 → 화면에서 image-placeholder로 대체. Phase 5에서 Storage URL 교체)
export const mockProductImages: ProductImage[] = mockProducts.flatMap(
  (p, idx) => {
    const count = (idx % 3) + 2; // 상품별 2~4장
    return Array.from({ length: count }, (_, i) => ({
      id: `${p.id}-img-${i + 1}`,
      productId: p.id,
      url: "",
      isPrimary: i === 0,
    }));
  }
);

/** 상품 id로 이미지 목록 조회 */
export function getMockImages(productId: string): ProductImage[] {
  return mockProductImages.filter((img) => img.productId === productId);
}

// 판매자 역할 평균 별점 (Mock 고정값) — 레벨과 함께 평판 표시에 사용
const sellerAvgScoreById: Record<string, number> = {
  "prof-1": 8.2,
  "prof-2": 9.1,
  "prof-3": 7.4,
  "prof-4": 8.0,
};

/** 프로필 → 판매자 평판 요약 파생 */
export function toSellerReputation(profileId: string): SellerReputation {
  const profile = getMockProfile(profileId);
  return {
    id: profile.id,
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
    region: profile.region,
    sellerLevel: profile.sellerLevel,
    sellerAvgScore: sellerAvgScoreById[profile.id] ?? 8.0,
  };
}

/** 상품 → 카드 표시용 요약 파생 */
function toAuctionSummary(product: Product): AuctionSummary {
  const primary = getMockImages(product.id).find((img) => img.isPrimary);
  return {
    id: product.id,
    title: product.title,
    primaryImageUrl: primary?.url ? primary.url : null,
    currentPrice: product.currentPrice,
    auctionEndsAt: product.auctionEndsAt,
    status: product.status,
    region: product.region,
  };
}

// 홈 목록 등에서 사용할 카드 요약 목록 (진행중 우선)
export const mockAuctionSummaries: AuctionSummary[] =
  mockProducts.map(toAuctionSummary);

/** 상품 id → 상세 표시용 파생 (이미지·카테고리·판매자 평판·입찰수 포함) */
export function getMockAuctionDetail(productId: string): AuctionDetail {
  const product =
    mockProducts.find((p) => p.id === productId) ?? mockProducts[0];
  // 입찰 수는 Mock 고정 매핑
  const bidCountById: Record<string, number> = {
    "prod-1": 12,
    "prod-2": 8,
    "prod-3": 5,
    "prod-4": 9,
    "prod-5": 0,
    "prod-6": 3,
  };
  return {
    ...product,
    images: getMockImages(product.id),
    category: getMockCategory(product.categoryId),
    seller: toSellerReputation(product.sellerId),
    bidCount: bidCountById[product.id] ?? 0,
  };
}

// 대표 상세 샘플 (상세 페이지/쇼케이스 기본값)
export const mockAuctionDetail: AuctionDetail = getMockAuctionDetail("prod-1");

// 판매자 평판 샘플 목록 (쇼케이스용)
export const mockSellerReputations: SellerReputation[] = mockProfiles.map((p) =>
  toSellerReputation(p.id)
);
