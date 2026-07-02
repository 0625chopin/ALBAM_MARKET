// 별점 표시 컴포넌트 (RSC, 읽기 전용)
// score(0~max)를 별 5개 스케일로 환산하여 채운 별/빈 별로 표시한다.
// 모바일 폭을 고려해 별 크기를 작게(size-4) 유지한다.

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatScore } from "@/lib/format";

interface StarRatingProps {
  /** 점수 (0 ~ max 범위) */
  score: number;
  /** 점수 최대값. 기본 10 */
  max?: number;
  /** 점수 텍스트 표시 여부. 기본 true */
  showValue?: boolean;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export function StarRating({
  score,
  max = 10,
  showValue = true,
  className,
}: StarRatingProps) {
  // 별 5개 스케일로 환산 (예: 9.1/10 → 4.55/5)
  const STAR_COUNT = 5;
  const scaledScore = (score / max) * STAR_COUNT;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`별점 ${formatScore(score)}점 (${max}점 만점)`}
      role="img"
    >
      {/* 별 5개 렌더: 점수만큼 채운 별, 나머지 빈 별 */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          // 현재 인덱스 기준으로 채움 여부 판단
          const isFilled = i < Math.round(scaledScore);
          return (
            <Star
              key={i}
              className={cn(
                "size-4 shrink-0",
                isFilled
                  ? "text-foreground fill-current"
                  : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* 점수 텍스트 (showValue가 true일 때만 표시) */}
      {showValue && (
        <span className="text-muted-foreground text-xs">
          {formatScore(score)}/{max}
        </span>
      )}
    </div>
  );
}
