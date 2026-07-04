// Mock 거래 데이터
import type { Transaction } from "@0625chopin/shared/types";

export const mockTransactions: Transaction[] = [
  // 내(prof-1)가 판매자: 원목 책상 낙찰 → 진행중
  {
    id: "txn-1",
    productId: "prod-4",
    sellerId: "prof-1",
    buyerId: "prof-3",
    finalPrice: 55000,
    status: "pending",
    endedAt: null,
  },
  // 내(prof-1)가 구매자(낙찰자): 아이폰 거래 완료
  {
    id: "txn-2",
    productId: "prod-2",
    sellerId: "prof-3",
    buyerId: "prof-1",
    finalPrice: 450000,
    status: "completed",
    endedAt: null,
  },
  // 내(prof-1)가 구매자: 자켓 자동완료
  {
    id: "txn-3",
    productId: "prod-1",
    sellerId: "prof-2",
    buyerId: "prof-1",
    finalPrice: 80000,
    status: "auto_completed",
    endedAt: null,
  },
];

/** 거래 id로 조회 */
export function getMockTransaction(id: string): Transaction {
  return mockTransactions.find((t) => t.id === id) ?? mockTransactions[0];
}
