"use client";

// 메시지 목록 컴포넌트 (Client Component)
// 시간 오름차순 메시지를 세로로 렌더링하고, 스크롤 가능 영역을 제공한다.
// 메시지가 추가되면(또는 마운트 시) 스크롤을 하단으로 이동해 최신 메시지를 노출한다.
import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { Message } from "@0625chopin/shared/types";

interface MessageListProps {
  /** 시간 오름차순 정렬된 메시지 배열 */
  messages: Message[];
  /** 현재 로그인 사용자 id (내 메시지 판별용) */
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  // 스크롤 컨테이너 참조 — 새 메시지 시 하단으로 스크롤
  const containerRef = useRef<HTMLDivElement>(null);

  // 메시지 개수 변화 시(전송/수신 포함) 컨테이너만 하단으로 스크롤 (창 전체는 건드리지 않음)
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    // 스크롤 가능 영역 — flex-1로 헤더/입력창 사이 공간 채움
    // min-h-0: flex 자식이 콘텐츠 높이로 늘어나지 않고 내부 스크롤되도록 보장
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto p-4"
      role="log"
      aria-label="채팅 메시지 목록"
      aria-live="polite"
    >
      {/* 메시지 목록: 세로 간격 적용 */}
      <div className="space-y-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={message.senderId === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
