// 데이터 조회 레이어 barrel (Phase 5 실데이터 전환)
// lib/mocks 와 대칭 구조: 페이지는 `@/lib/queries` 에서 조회 함수를 가져와
// 기존 Mock import 를 한 줄 교체하는 방식으로 실데이터로 전환한다(컴포넌트 무수정).

export {
  getCurrentUserId,
  fetchProfile,
  fetchCurrentProfile,
  fetchProfileScores,
} from "./profiles";
export type { ProfileScores } from "./profiles";
export { fetchAuctionSummaries, fetchAuctionDetail } from "./auctions";
