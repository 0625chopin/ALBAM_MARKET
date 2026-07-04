// 채팅방 페이지 (Phase 2 정적 → Phase 5 T057 실데이터 + Realtime)
// cacheComponents 패턴: 동기 shell → Suspense → async ChatRoomContent
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@0625chopin/shared/ui/skeleton";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatThread } from "@/components/chat/chat-thread";
import { getCurrentUserId } from "@/lib/queries";
import { fetchChatRoom, fetchMessages } from "@/lib/queries/chat";

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

// 동기 페이지 shell: prerender 허용을 위해 동기 컴포넌트로 유지
export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  return (
    // 430px 모바일 프레임 기준 세로 채팅 레이아웃
    // 루트 레이아웃(min-h-screen flex-col + 하단 BottomNav) 흐름에 맞춰 flex-1로
    // 남은 높이를 채운다. h-svh로 독립 높이를 잡으면 입력창이 BottomNav와 겹쳐 가려진다.
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col border-x">
      <Suspense
        fallback={
          // 채팅방 로딩 중 스켈레톤 UI
          <div className="flex flex-1 flex-col">
            {/* 헤더 스켈레톤 */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            {/* 메시지 영역 스켈레톤 */}
            <div className="flex-1 space-y-3 p-4">
              <Skeleton className="ml-auto h-10 w-48 rounded-2xl" />
              <Skeleton className="h-10 w-48 rounded-2xl" />
              <Skeleton className="ml-auto h-8 w-36 rounded-2xl" />
            </div>
            {/* 입력 바 스켈레톤 */}
            <Skeleton className="h-14 w-full rounded-none" />
          </div>
        }
      >
        <ChatRoomContent params={params} />
      </Suspense>
    </div>
  );
}

// 동적 파라미터 처리 및 채팅 데이터 조회 (async RSC)
async function ChatRoomContent({ params }: ChatRoomPageProps) {
  const { roomId } = await params;

  // 세션 확인 (비로그인 차단)
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  // 채팅방 조회 (당사자 아니면 null → 접근 차단)
  const room = await fetchChatRoom(roomId);
  if (!room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-foreground text-sm font-semibold">
          채팅방에 접근할 수 없습니다
        </p>
        <p className="text-muted-foreground text-xs">
          존재하지 않거나 거래 당사자만 입장할 수 있습니다.
        </p>
      </div>
    );
  }

  // 메시지 목록 (시간 오름차순)
  const messages = await fetchMessages(roomId);

  return (
    <>
      {/* 채팅 헤더: 상대방 닉네임, 평점, 신고 */}
      <ChatHeader
        counterpartId={room.counterpartId}
        nickname={room.counterpartNickname}
        score={room.counterpartScore}
      />

      {/* 채팅 스레드(Client): 메시지 목록 + 입력 */}
      {/* 메시지 전송은 messages insert, 신규 메시지는 Realtime 구독으로 동기화 */}
      {/* 거래 완료 확정은 거래 목록(/transactions)의 거래완료 버튼에서 수행한다 */}
      <ChatThread
        roomId={roomId}
        initialMessages={messages}
        currentUserId={userId}
      />
    </>
  );
}
