// 채팅 메시지 말풍선 컴포넌트 (RSC)
// isMine=true: 우측 정렬, primary 배경색
// isMine=false: 좌측 정렬, muted 배경색
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  /** 메시지 데이터 */
  message: Message;
  /** 현재 로그인 사용자의 메시지 여부 */
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    // 내 메시지: 오른쪽 정렬 / 상대 메시지: 왼쪽 정렬
    <div
      className={cn(
        "flex flex-col gap-1",
        isMine ? "items-end" : "items-start"
      )}
    >
      {/* 말풍선 본문 */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isMine
            ? // 내 메시지: 우측 꼭지점 약하게, primary 배색
              "bg-primary text-primary-foreground ml-auto rounded-tr-sm"
            : // 상대 메시지: 좌측 꼭지점 약하게, muted 배색
              "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {message.content}
      </div>

      {/* 전송 시각 (HH:MM 형식) */}
      <time
        dateTime={message.createdAt}
        className="text-muted-foreground text-[10px]"
      >
        {formatTime(message.createdAt)}
      </time>
    </div>
  );
}
