"use client";

// 채팅 스레드 컨테이너 (Client Component, T057 실데이터 + Realtime)
// 메시지 전송은 Supabase messages insert, 신규 메시지는 Realtime(postgres_changes) 구독으로 수신한다.
// 표현 컴포넌트(MessageList/MessageInput/MessageBubble)는 수정하지 않는다.

import { useEffect, useState } from "react";
import { createClient } from "@0625chopin/shared/supabase/client";
import { sendMessage } from "@/lib/mutations/chat";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { toMessage } from "@0625chopin/shared/queries/map";
import type { Message } from "@0625chopin/shared/types";
import type { Tables } from "@0625chopin/shared/database";

interface ChatThreadProps {
  /** 채팅방 id */
  roomId: string;
  /** 서버에서 조회한 초기 메시지 (시간 오름차순) */
  initialMessages: Message[];
  /** 현재 로그인 사용자 id (내 메시지 판별·발신자 지정용) */
  currentUserId: string;
  /** 메시지 목록과 입력창 사이에 렌더할 노드 (예: 구매자 거래완료 버튼) */
  beforeInput?: React.ReactNode;
}

export function ChatThread({
  roomId,
  initialMessages,
  currentUserId,
  beforeInput,
}: ChatThreadProps) {
  // 메시지 목록 상태
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  // Realtime 구독 — 이 방의 messages INSERT 수신 시 목록에 병합(id 기준 중복 제거)
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      // Realtime 소켓을 사용자 JWT 로 인증한 뒤 구독한다(RLS 적용 필수).
      // createBrowserClient 는 세션을 비동기 복원하므로 즉시 subscribe 하면 anon 으로 join 되어
      // RLS(messages_select_party)가 수신자 측 신규 메시지 전달을 차단할 수 있다.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      await supabase.realtime.setAuth(session?.access_token ?? null);

      channel = supabase
        .channel(`messages:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as Tables<"messages">;
            setMessages((prev) =>
              prev.some((m) => m.id === row.id)
                ? prev
                : [...prev, toMessage(row)]
            );
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 메시지 전송 — messages insert 후 낙관적 반영(Realtime 수신과 중복 시 id로 제거)
  const handleSend = async (content: string) => {
    try {
      const saved = await sendMessage(roomId, content);
      setMessages((prev) =>
        prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]
      );
    } catch {
      // 전송 실패는 조용히 무시(입력값 유지). 추후 토스트 등으로 보강 가능.
    }
  };

  return (
    <>
      {/* 메시지 목록 (flex-1 스크롤 영역) */}
      <MessageList messages={messages} currentUserId={currentUserId} />

      {/* 목록과 입력창 사이 슬롯 (구매자 거래완료 버튼 등) */}
      {beforeInput}

      {/* 메시지 입력 바 — 전송 시 handleSend로 낙관적 추가 */}
      <MessageInput onSend={handleSend} />
    </>
  );
}
