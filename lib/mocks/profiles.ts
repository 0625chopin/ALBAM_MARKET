// Mock 회원(프로필) 데이터
// 실제 DB 전환(Phase 5) 시 동일 타입을 유지하고 조회부만 교체한다.
import type { Profile } from "@/lib/types";

// 현재 로그인 사용자로 가정하는 프로필 id (Mock 단계 편의용)
export const CURRENT_USER_ID = "prof-1";

export const mockProfiles: Profile[] = [
  {
    id: "prof-1",
    nickname: "김알밤",
    region: "서울",
    avatarUrl: null,
    sellerLevel: 3,
    buyerLevel: 2,
  },
  {
    id: "prof-2",
    nickname: "도토리상점",
    region: "경기",
    avatarUrl: null,
    sellerLevel: 5,
    buyerLevel: 1,
  },
  {
    id: "prof-3",
    nickname: "다람쥐",
    region: "인천",
    avatarUrl: null,
    sellerLevel: 1,
    buyerLevel: 4,
  },
  {
    id: "prof-4",
    nickname: "밤톨이",
    region: "부산",
    avatarUrl: null,
    sellerLevel: 2,
    buyerLevel: 2,
  },
];

/** id로 프로필 조회 (없으면 첫 번째 반환) */
export function getMockProfile(id: string): Profile {
  return mockProfiles.find((p) => p.id === id) ?? mockProfiles[0];
}
