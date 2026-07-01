// 빈 상태 안내 컴포넌트 (RSC)
// 데이터가 없을 때 아이콘 + 제목 + 설명 + CTA 버튼을 중앙 정렬로 표시한다.
// 경매 목록 없음, 거래 내역 없음 등 다양한 빈 상태에 재사용한다.

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** 빈 상태를 표현하는 Lucide 아이콘 (선택) */
  icon?: LucideIcon;
  /** 빈 상태 제목 (필수) */
  title: string;
  /** 부가 설명 (선택) */
  description?: string;
  /** CTA 버튼 레이블 (actionHref와 함께 있을 때만 표시) */
  actionLabel?: string;
  /** CTA 버튼 이동 경로 (actionLabel과 함께 있을 때만 표시) */
  actionHref?: string;
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        // 중앙 정렬, 상하 여백 충분히
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* 아이콘: bg-muted 원형 배경 안에 배치 */}
      {Icon && (
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {/* 빈 상태 제목 */}
      <p className="text-base font-semibold text-foreground">{title}</p>

      {/* 부가 설명 (선택적 표시) */}
      {description && (
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* CTA 버튼: actionLabel과 actionHref 모두 있을 때만 렌더 */}
      {actionLabel && actionHref && (
        <Button asChild className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
