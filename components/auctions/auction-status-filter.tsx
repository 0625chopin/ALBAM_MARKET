// 홈 상단 경매 상태 필터 탭 (서버 컴포넌트)
// Link 기반이라 클라이언트 JS 없이 동작한다. 선택 시 `?status=` 쿼리로 이동하고,
// 서버(page.tsx)가 해당 상태로 목록을 재조회한다. 기본값은 "active"(경매중)이며
// 기본 상태 탭은 쿼리 없는 "/"로 링크한다.

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AuctionStatusFilterValue } from "@/lib/queries";

// 탭 노출 순서 (전체 + 실제 상품 상태 5종)
const STATUS_ORDER: Exclude<AuctionStatusFilterValue, "all">[] = [
  "active",
  "won",
  "failed",
  "withdrawn",
  "completed",
];

interface AuctionStatusFilterProps {
  /** 현재 선택된 상태 */
  current: AuctionStatusFilterValue;
  /** 상태 라벨 맵 value→label (DB 공통코드 주입) */
  labels: Record<string, string>;
}

export function AuctionStatusFilter({
  current,
  labels,
}: AuctionStatusFilterProps) {
  // 전체 + 실제 상태 5종을 라벨 맵(DB 또는 상수)으로부터 구성
  const FILTER_TABS: { value: AuctionStatusFilterValue; label: string }[] = [
    { value: "all", label: "전체" },
    ...STATUS_ORDER.map((value) => ({
      value,
      label: labels[value] ?? value,
    })),
  ];

  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="tablist"
      aria-label="경매 상태 필터"
    >
      {FILTER_TABS.map((tab) => {
        const isActive = tab.value === current;
        // 기본값(경매중)은 쿼리 없는 "/"로, 그 외는 ?status= 부여
        const href = tab.value === "active" ? "/" : `/?status=${tab.value}`;
        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
