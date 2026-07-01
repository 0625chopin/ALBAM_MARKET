"use client";

// 알밤마켓 모바일 하단 탭바 네비게이션
// 모바일 사이즈 프레임(430px) 하단에 고정되어 주요 화면 간 이동을 제공
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, ArrowLeftRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

// 하단 탭 항목 (아이콘 + 라벨)
const TAB_ITEMS = [
  { label: "홈", href: "/", icon: Home },
  { label: "경매 등록", href: "/auctions/new", icon: PlusCircle },
  { label: "거래", href: "/transactions", icon: ArrowLeftRight },
  { label: "프로필", href: "/profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // 인증 관련 화면(로그인/회원가입 등)에서는 하단 탭바를 숨김
  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav
      className="sticky bottom-0 z-50 border-t border-t-foreground/10 bg-background"
      aria-label="주요 메뉴"
    >
      <ul className="flex items-stretch justify-around">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          // 홈은 정확히 일치할 때만, 나머지는 하위 경로 포함하여 활성 처리
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
