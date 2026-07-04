"use client";

// 메시지 입력 바 컴포넌트 (Client Component)
// 텍스트 입력 필드 + 전송 버튼으로 구성된다.
// 입력 내용은 onSend 콜백으로 부모(ChatThread)에 전달한다.
// Phase 5: 부모의 onSend 내부를 Supabase Realtime insert로 교체한다.
import { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@0625chopin/shared/ui/input";
import { Button } from "@0625chopin/shared/ui/button";

interface MessageInputProps {
  /** 전송 시 입력 내용을 전달받는 콜백 (없으면 표시 전용) */
  onSend?: (content: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  // 입력값 상태 — 표시 및 전송 버튼 활성화 제어용
  const [value, setValue] = useState("");

  // 전송 처리 — 공백 제거 후 onSend로 전달하고 입력 초기화
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSend?.(trimmed);
    setValue("");
  };

  return (
    <form
      className="bg-background flex items-center gap-2 border-t px-4 py-3"
      onSubmit={handleSubmit}
    >
      {/* 메시지 텍스트 입력 필드 */}
      <Input
        type="text"
        placeholder="메시지를 입력하세요"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
        aria-label="메시지 입력"
        autoComplete="off"
      />

      {/* 전송 버튼 — 입력값이 없으면 비활성화 */}
      <Button
        type="submit"
        size="icon"
        aria-label="메시지 전송"
        disabled={value.trim().length === 0}
      >
        <Send className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
