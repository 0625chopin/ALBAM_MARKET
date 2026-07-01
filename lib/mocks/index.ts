// Mock 데이터 barrel
// 사용처에서 `import { mockAuctionSummaries } from "@/lib/mocks"` 형태로 사용한다.
// Phase 5 실데이터 전환 시 페이지의 이 import만 Supabase 조회로 교체(컴포넌트 무수정).

export { mockProfiles, getMockProfile, CURRENT_USER_ID } from "./profiles";
export { mockCategories, getMockCategory } from "./categories";
export {
  mockProducts,
  mockProductImages,
  getMockImages,
  toSellerReputation,
  mockAuctionSummaries,
  getMockAuctionDetail,
  mockAuctionDetail,
  mockSellerReputations,
} from "./products";
export { mockBids, getMockBids } from "./bids";
export { mockTransactions, getMockTransaction } from "./transactions";
export { mockRatings, getMockRatings } from "./ratings";
export { mockChatRooms, mockMessages, getMockMessages } from "./chat";
export { mockPenalties, getMockPenalties } from "./penalties";
