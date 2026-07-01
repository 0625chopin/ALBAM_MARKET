// 채팅 메시지 목록 스켈레톤 (RSC)
// MessageList + MessageBubble 레이아웃(좌우 정렬 말풍선)을 본떠 로딩 상태를 표시한다.
// flex-1로 채팅 화면 가운데 영역을 가득 채운다.

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MessageListSkeletonProps {
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
}

export function MessageListSkeleton({ className }: MessageListSkeletonProps) {
  return (
    // MessageList와 동일한 컨테이너 — flex-1로 헤더/입력창 사이 공간 채움
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto p-4", className)}
      aria-busy="true"
      aria-label="메시지 로딩 중"
    >
      <div className="space-y-2">
        {/* 내 메시지 (우측 정렬) — rounded-tr-sm은 MessageBubble의 꼭지점 스타일 */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-tr-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>

        {/* 상대방 메시지 (좌측 정렬) — rounded-tl-sm은 MessageBubble의 꼭지점 스타일 */}
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>

        {/* 내 메시지 (우측, 짧음) */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-8 w-36 rounded-2xl rounded-tr-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>

        {/* 상대방 메시지 (좌측, 중간 길이) */}
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-10 w-52 rounded-2xl rounded-tl-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>

        {/* 내 메시지 (우측, 여러 줄) */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-14 w-52 rounded-2xl rounded-tr-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>

        {/* 상대방 메시지 (좌측, 짧음) */}
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-8 w-32 rounded-2xl rounded-tl-sm" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      </div>
    </div>
  );
}
