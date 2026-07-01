// 레벨 배지 컴포넌트 (RSC)
// 사용자의 판매/구매 레벨을 "Lv.N" 형태로 표시한다.
// role prop으로 판매/구매 역할을 접두어로 추가할 수 있다.

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { levelLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  /** 레벨 숫자 */
  level: number;
  /** 역할: seller(판매), buyer(구매). 미전달 시 역할 접두어 없음 */
  role?: "seller" | "buyer";
  /** 추가 Tailwind 클래스 */
  className?: string;
}

/** 역할별 접두 라벨 맵 */
const ROLE_PREFIX: Record<"seller" | "buyer", string> = {
  seller: "판매",
  buyer: "구매",
};

export function LevelBadge({ level, role, className }: LevelBadgeProps) {
  // "판매 Lv.3" 또는 "Lv.3" 형태로 라벨 조합
  const label = role
    ? `${ROLE_PREFIX[role]} ${levelLabel(level)}`
    : levelLabel(level);

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1", className)}
    >
      {/* 신뢰/레벨 아이콘 */}
      <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
