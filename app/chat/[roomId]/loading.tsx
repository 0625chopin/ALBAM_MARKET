// 채팅방(/chat/[roomId]) 로딩 UI (Next.js App Router loading.tsx 규약)
// page.tsx 골격(430px 컨테이너 + 헤더 + 메시지 목록 + 입력바)과 동일한 구조로 스켈레톤을 렌더한다.
// page.tsx에는 SiteHeader/SiteFooter가 없으므로 loading.tsx도 동일하게 제외.

import { Skeleton } from "@0625chopin/shared/ui/skeleton";
import { MessageListSkeleton } from "@/components/chat/message-list-skeleton";

export default function ChatRoomLoading() {
  return (
    // page.tsx 최상위 래퍼와 동일한 클래스
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col border-x">
      {/* 채팅 헤더(ChatHeader) 스켈레톤 — 뒤로가기 + 아바타 + 닉네임/별점 */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {/* 뒤로가기 버튼 */}
        <Skeleton className="size-5 rounded" />
        {/* 상대방 아바타 */}
        <Skeleton className="size-8 rounded-full" />
        {/* 닉네임 + 별점 */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* 메시지 목록 스켈레톤 — flex-1로 헤더/입력창 사이 공간 채움 */}
      <MessageListSkeleton />

      {/* 메시지 입력바(MessageInput) 스켈레톤 */}
      <Skeleton className="h-14 w-full rounded-none" />
    </div>
  );
}
