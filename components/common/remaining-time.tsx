"use client";

// 남은 시간 표시 컴포넌트 (Client Component)
// SSR/CSR 불일치(hydration mismatch)를 방지하기 위해
// 마운트 후 현재 시각을 계산하여 남은 시간을 표시한다.
// TODO: Phase 3에서 1분 단위 라이브 카운트다운 추가 예정 (setInterval 사용)

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRemainingTime } from "@/lib/format";

interface RemainingTimeProps {
  /** 마감 시각 (ISO 8601 문자열) */
  endsAt: string;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export function RemainingTime({ endsAt, className }: RemainingTimeProps) {
  // 마운트 전 빈 문자열로 초기화하여 SSR/CSR 불일치 방지
  const [timeText, setTimeText] = useState<string>("");

  useEffect(() => {
    // 마운트 후 클라이언트 현재 시각으로 남은 시간 계산
    setTimeText(formatRemainingTime(endsAt));
  }, [endsAt]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
      aria-label={`마감까지 ${timeText || "계산 중"}`}
    >
      <Clock className="size-3 shrink-0" aria-hidden="true" />
      {/* 마운트 전에는 "—"를 표시하여 레이아웃 밀림 방지 */}
      <span>{timeText || "—"}</span>
    </div>
  );
}
