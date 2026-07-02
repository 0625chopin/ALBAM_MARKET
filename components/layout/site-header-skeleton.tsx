// 사이트 헤더 스켈레톤 (정적 — 로딩 상태 전용)
// loading.tsx는 정적으로 prerender되는 즉시 로딩 셸이므로,
// 인증/세션(Date.now 기반 JWT 검사)에 의존하는 SiteHeader → AuthButton을 렌더하면
// Cache Components 규칙(현재 시각을 서버 컴포넌트에서 읽기 전 uncached data 필요)을 위반한다.
// 따라서 로딩 상태에서는 동적 의존성이 없는 이 정적 스켈레톤을 사용한다.

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// SiteHeader와 동일한 네비게이션 항목 (시각적 일관성 유지)
const NAV_ITEMS = [
  { label: "홈", href: "/" },
  { label: "경매 등록", href: "/auctions/new" },
  { label: "거래", href: "/transactions" },
  { label: "프로필", href: "/profile" },
] as const;

export function SiteHeaderSkeleton() {
  return (
    <header className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
      <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
        {/* 좌측: 브랜드 + 네비게이션 (SiteHeader와 동일 레이아웃) */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-foreground hover:text-foreground/80 font-bold"
          >
            알밤마켓
          </Link>
          <nav className="hidden items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 우측: 인증 버튼 + 테마 토글 자리 스켈레톤 (동적 의존성 없음) */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </header>
  );
}
