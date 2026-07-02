// 알밤마켓 도메인 헤더 (서버 컴포넌트)
// 브랜드 링크, 네비게이션, 인증 버튼, 테마 토글 포함
import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { cn } from "@/lib/utils";

// 도메인 네비게이션 항목 (아직 없는 라우트는 링크만 배치)
const NAV_ITEMS = [
  { label: "홈", href: "/" },
  { label: "경매 등록", href: "/auctions/new" },
  { label: "거래", href: "/transactions" },
  { label: "프로필", href: "/profile" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
      <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
        {/* 좌측: 브랜드 + 메인 네비게이션 */}
        <div className="flex items-center gap-6">
          {/* 브랜드 링크 */}
          <Link
            href="/"
            className="text-foreground hover:text-foreground/80 font-bold"
          >
            알밤마켓
          </Link>

          {/* 네비게이션 링크 목록
              모바일 프레임(430px)에서는 가로 네비를 숨김.
              TODO: Phase 2에서 햄버거 드로어 또는 하단 탭바로 모바일 네비 구현 */}
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

        {/* 우측: 인증 버튼 + 테마 토글 */}
        <div className="flex items-center gap-3">
          {/* 환경 변수 미설정 시 경고, 설정 시 인증 버튼 */}
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
