"use client";

// 상품 이미지 컴포넌트 (Client Component)
// next/image 로 원격 이미지를 표시하되, 로드 실패(onError) 시 ImagePlaceholder 로 폴백한다.
// ISSUE-022: Storage 객체 부재 등으로 이미지가 깨질 때 깨진 아이콘 대신 자리표시자를 노출한다.
// RSC(예: auction-card)에서 자식으로 사용 가능하다.

import { useState } from "react";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/common/image-placeholder";

interface ProductImageProps {
  /** 이미지 원본 URL */
  src: string;
  /** 접근성 alt 텍스트 */
  alt: string;
  /** next/image 고정 width */
  width: number;
  /** next/image 고정 height */
  height: number;
  /** 이미지에 적용할 Tailwind 클래스 (object-cover 등) */
  className?: string;
  /** next/image sizes 힌트 */
  sizes?: string;
  /** LCP 우선 로드 여부 */
  priority?: boolean;
  /** 폴백 자리표시자에 적용할 클래스 (미지정 시 className 재사용) */
  placeholderClassName?: string;
  /** 폴백 자리표시자 라벨 (미지정 시 alt 재사용) */
  placeholderLabel?: string;
}

export function ProductImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority,
  placeholderClassName,
  placeholderLabel,
}: ProductImageProps) {
  // 로드 실패 여부 — true 가 되면 자리표시자로 전환한다.
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <ImagePlaceholder
        className={placeholderClassName ?? className}
        label={placeholderLabel ?? alt}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setErrored(true)}
    />
  );
}
