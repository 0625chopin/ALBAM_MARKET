// 이미지 자리 표시 컴포넌트 (RSC)
// 상품 이미지나 아바타가 없을 때 회색 박스 + 아이콘으로 대체 표시한다.
// 부모 컴포넌트가 className으로 크기(w-*, h-*) 및 종횡비(aspect-*)를 제어한다.

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  /** 부모에서 크기·종횡비·모서리 등을 주입하는 Tailwind 클래스 */
  className?: string;
  /** 스크린리더 대체 텍스트 (기본: "이미지 없음") */
  label?: string;
}

export function ImagePlaceholder({
  className,
  label = "이미지 없음",
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className
      )}
    >
      {/* 이미지 아이콘: 부모 크기에 맞춰 상대적으로 표시 */}
      <ImageIcon className="h-1/3 w-1/3 opacity-50" aria-hidden="true" />
      {/* 스크린리더 전용 라벨 */}
      <span className="sr-only">{label}</span>
    </div>
  );
}
