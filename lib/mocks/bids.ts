// Mock 입찰 데이터
import type { Bid } from "@/lib/types";

export const mockBids: Bid[] = [
  {
    id: "bid-1",
    productId: "prod-1",
    bidderId: "prof-3",
    amount: 25000,
    status: "active",
  },
  {
    id: "bid-2",
    productId: "prod-1",
    bidderId: "prof-4",
    amount: 30000,
    status: "active",
  },
  {
    id: "bid-3",
    productId: "prod-1",
    bidderId: "prof-1",
    amount: 35000,
    status: "active",
  },
  {
    id: "bid-4",
    productId: "prod-2",
    bidderId: "prof-1",
    amount: 400000,
    status: "active",
  },
  {
    id: "bid-5",
    productId: "prod-2",
    bidderId: "prof-4",
    amount: 450000,
    status: "active",
  },
  {
    id: "bid-6",
    productId: "prod-4",
    bidderId: "prof-3",
    amount: 55000,
    status: "won",
  },
];

/** 상품 id로 입찰 목록 조회 (최신 금액 내림차순) */
export function getMockBids(productId: string): Bid[] {
  return mockBids
    .filter((b) => b.productId === productId)
    .sort((a, b) => b.amount - a.amount);
}
