// 채팅방 상단 헤더 컴포넌트 (RSC)
// 상대방 아바타(이름 첫 글자), 닉네임, 별점을 표시한다.
// 뒤로가기는 Link로 처리 — RSC이므로 onClick 이벤트 핸들러 사용 금지.
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@0625chopin/shared/ui/avatar";
import { StarRating } from "@0625chopin/shared/common/star-rating";
import { ReportDialog } from "@/components/report/report-dialog";

interface ChatHeaderProps {
  /** 상대방 사용자 id (사용자 신고 대상) */
  counterpartId: string;
  /** 상대방 닉네임 */
  nickname: string;
  /** 상대방 평점 (0~10 범위) */
  score: number;
}

export function ChatHeader({
  counterpartId,
  nickname,
  score,
}: ChatHeaderProps) {
  // 아바타 폴백: 닉네임 첫 글자
  const initial = nickname.charAt(0);

  return (
    <header className="bg-background flex items-center gap-3 border-b px-4 py-3">
      {/* 뒤로가기 링크 — onClick 없이 Link만 사용(RSC 규칙) */}
      <Link
        href="/transactions"
        className="text-muted-foreground hover:text-foreground flex shrink-0 items-center transition-colors"
        aria-label="거래 목록으로 돌아가기"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>

      {/* 상대방 아바타 */}
      <Avatar size="default">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>

      {/* 닉네임 + 별점 영역 */}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-foreground text-sm font-semibold">
          {nickname}
        </span>
        {/* TODO: Phase 5 — 실제 평점 데이터로 교체 */}
        <StarRating score={score} max={10} />
      </div>

      {/* 상대방 사용자 신고 (FA050) */}
      <ReportDialog
        targetType="user"
        targetId={counterpartId}
        targetLabel={nickname}
        triggerLabel="신고"
        triggerVariant="ghost"
        triggerClassName="shrink-0"
      />
    </header>
  );
}
