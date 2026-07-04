// Mock 별점/평점 데이터 (거래완료 후 상호 부여)
import type { Rating } from "@0625chopin/shared/types";

export const mockRatings: Rating[] = [
  // txn-2(완료): 구매자 prof-1 → 판매자 prof-3
  {
    id: "rat-1",
    transactionId: "txn-2",
    raterId: "prof-1",
    rateeId: "prof-3",
    role: "as_seller",
    score: 9,
    comment:
      "친절하게 응대해 주시고 물건 상태도 설명 그대로였어요. 감사합니다!",
  },
  // txn-2(완료): 판매자 prof-3 → 구매자 prof-1
  {
    id: "rat-2",
    transactionId: "txn-2",
    raterId: "prof-3",
    rateeId: "prof-1",
    role: "as_buyer",
    score: 8,
    comment: null,
  },
];

/** 거래 id로 평점 목록 조회 */
export function getMockRatings(transactionId: string): Rating[] {
  return mockRatings.filter((r) => r.transactionId === transactionId);
}
