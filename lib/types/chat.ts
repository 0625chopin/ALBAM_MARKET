// 채팅 도메인 타입
// PRD 데이터 모델 chat_rooms / messages 테이블을 camelCase로 1:1 매핑한다.

/**
 * 채팅방 (낙찰 성립 시 자동 생성, 판매자-낙찰자 1:1)
 * - PRD: chat_rooms
 */
export interface ChatRoom {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 연결 거래 (transactions.id) */
  transactionId: string;
  /** 판매자 (profiles.id) */
  sellerId: string;
  /** 낙찰자(구매자, profiles.id) */
  buyerId: string;
}

/**
 * 채팅 메시지
 * - PRD: messages
 */
export interface Message {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 소속 채팅방 (chat_rooms.id) */
  roomId: string;
  /** 발신자 (profiles.id) */
  senderId: string;
  /** 메시지 내용 */
  content: string;
  /** 전송 시각 (ISO 8601) */
  createdAt: string;
}
