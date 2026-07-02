// 경매 진행 시간 관련 클라이언트 상수.
// 진행 시간 "옵션 목록"은 공통코드(codes.auction_duration)로 이관되어
// 서버에서 프로세스 싱글턴으로 로딩된다(lib/queries/codes.ts fetchAuctionDurationOptions).
// 여기에는 옵션 로딩과 무관한 초기 선택값 폴백만 둔다.

/** 진행 시간 Select 초기 선택값 폴백(시간). 정책 기본값이 옵션에 없을 때 사용. */
export const DEFAULT_AUCTION_DURATION_HOURS = 24;
