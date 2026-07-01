// 채팅 컴포넌트 전시 쇼케이스 (RSC)
// ChatHeader + ChatThread(MessageList + MessageInput)를 430px 모바일 프레임 내에서 전시한다.
// 입력창에 메시지를 입력해 전송하면 낙관적으로 목록에 추가된다(T031/Mock).
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatThread } from "@/components/chat/chat-thread";
import { getMockMessages, CURRENT_USER_ID, getMockProfile } from "@/lib/mocks";

export default function ChatShowcase() {
  // 전시용 메시지: room-1 (좌우 혼합 대화)
  const messages = getMockMessages("room-1");

  // 전시용 상대방: prof-3 (다람쥐) — 현재 사용자(prof-1)의 대화 상대
  const counterpart = getMockProfile("prof-3");

  return (
    <section id="chat" className="mb-16 scroll-mt-20">
      <h2 className="mb-6 text-2xl font-bold text-foreground">채팅</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        채팅 화면 컴포넌트 — ChatHeader(상단 헤더) + ChatThread(메시지 목록 +
        입력 바)를 430px 모바일 프레임으로 전시합니다. 입력창에 메시지를 보내면
        낙관적으로 목록에 추가됩니다(Mock).
      </p>

      {/* 430px 모바일 프레임 내 채팅 UI 전시 — 고정 높이 flex 컬럼으로 스크롤 시연 */}
      <div className="mx-auto max-w-[430px] overflow-hidden rounded-lg border">
        <div className="flex h-96 flex-col">
          {/* 채팅 헤더: 상대방 아바타, 닉네임, 별점 */}
          <ChatHeader
            nickname={counterpart.nickname}
            score={8.5}
            // TODO: Phase 5 — 실제 평점 데이터로 교체
          />

          {/* 채팅 스레드: 메시지 목록 + 입력(전송 시 낙관적 추가) */}
          <ChatThread
            roomId="room-1"
            initialMessages={messages}
            currentUserId={CURRENT_USER_ID}
          />
        </div>
      </div>
    </section>
  );
}
