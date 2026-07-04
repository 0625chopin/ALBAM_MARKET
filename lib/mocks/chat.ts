// Mock 채팅방 + 메시지 데이터
import type { ChatRoom, Message } from "@0625chopin/shared/types";

export const mockChatRooms: ChatRoom[] = [
  // txn-1(원목 책상 낙찰): 판매자 prof-1(나) ↔ 낙찰자 prof-3
  {
    id: "room-1",
    transactionId: "txn-1",
    sellerId: "prof-1",
    buyerId: "prof-3",
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    roomId: "room-1",
    senderId: "prof-3",
    content: "안녕하세요! 원목 책상 낙찰받았습니다. 직거래 가능할까요?",
    createdAt: "2026-06-28T20:10:00+09:00",
  },
  {
    id: "msg-2",
    roomId: "room-1",
    senderId: "prof-1",
    content: "네 안녕하세요! 가능합니다. 어느 지역에서 거래 원하세요?",
    createdAt: "2026-06-28T20:12:00+09:00",
  },
  {
    id: "msg-3",
    roomId: "room-1",
    senderId: "prof-3",
    content: "강남역 근처 가능하세요? 내일 저녁 7시쯤이요.",
    createdAt: "2026-06-28T20:15:00+09:00",
  },
  {
    id: "msg-4",
    roomId: "room-1",
    senderId: "prof-1",
    content: "좋습니다. 강남역 2번 출구에서 뵙겠습니다 🙂",
    createdAt: "2026-06-28T20:16:00+09:00",
  },
];

/** 채팅방 id로 메시지 목록 조회 (시간 오름차순) */
export function getMockMessages(roomId: string): Message[] {
  return mockMessages
    .filter((m) => m.roomId === roomId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}
