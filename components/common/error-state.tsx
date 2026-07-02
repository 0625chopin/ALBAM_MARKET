// 오류 상태 안내 컴포넌트 (RSC — onRetry 사용 시 부모가 'use client' 담당)
// API 오류나 예기치 못한 문제를 경고 아이콘 + 제목 + 설명 + 재시도 버튼으로 안내한다.
// onRetry 콜백은 부모(error.tsx 등 client component)가 전달하므로 이 컴포넌트는 'use client' 불필요.

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** 오류 제목 (기본값: "문제가 발생했습니다") */
  title?: string;
  /** 오류 설명 (선택) */
  description?: string;
  /** 재시도 콜백 — 있을 때만 "다시 시도" 버튼 표시 */
  onRetry?: () => void;
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
}

export function ErrorState({
  title = "문제가 발생했습니다",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        // 중앙 정렬, 상하 여백 충분히
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      role="alert"
      aria-label={title}
    >
      {/* 경고 아이콘: bg-muted 원형 배경 안에 배치 */}
      <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <AlertTriangle
          className="text-muted-foreground size-8"
          aria-hidden="true"
        />
      </div>

      {/* 오류 제목 */}
      <p className="text-foreground text-base font-semibold">{title}</p>

      {/* 오류 설명 (선택적 표시) */}
      {description && (
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">
          {description}
        </p>
      )}

      {/* 재시도 버튼: onRetry 콜백이 있을 때만 렌더 */}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6">
          다시 시도
        </Button>
      )}
    </div>
  );
}
