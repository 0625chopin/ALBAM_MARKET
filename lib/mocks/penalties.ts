// Mock 패널티 데이터 (낙찰 포기/위반 기록)
import type { Penalty } from "@/lib/types";

export const mockPenalties: Penalty[] = [
  {
    id: "pen-1",
    userId: "prof-4",
    reason: "abandon", // 낙찰 포기
    createdAt: "2026-06-25T14:00:00+09:00",
  },
];

/** 회원 id로 패널티 목록 조회 */
export function getMockPenalties(userId: string): Penalty[] {
  return mockPenalties.filter((p) => p.userId === userId);
}
