// 경매 상품 이미지 갤러리 컴포넌트 (RSC)
// 대표 이미지 1장(큰 영역) + 하단 썸네일 가로 스크롤 줄로 구성한다.
// url이 있으면 next/image, 없으면 ImagePlaceholder로 표시한다(T052 실 이미지 연동).
// Phase 3에서 캐러셀/썸네일 선택 인터랙션 추가 예정 (현재는 정적 표시).

import Image from "next/image";
import { ImagePlaceholder } from "@/components/common/image-placeholder";
import type { ProductImage } from "@/lib/types";

interface AuctionGalleryProps {
  /** 상품 이미지 목록 (isPrimary: true가 대표 이미지) */
  images: ProductImage[];
  /** 접근성 alt 텍스트 기반 */
  title: string;
}

export function AuctionGallery({ images, title }: AuctionGalleryProps) {
  // 대표 이미지 선택: isPrimary가 true인 것, 없으면 첫 번째
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];
  // 썸네일 목록: 전체 이미지(대표 포함 최대 표시)
  const thumbnails = images;

  return (
    <section aria-label={`${title} 상품 이미지`} className="w-full">
      {/* 대표 이미지 영역 — 정사각형 전체 폭 */}
      <div className="w-full overflow-hidden">
        {primaryImage && primaryImage.url ? (
          <Image
            src={primaryImage.url}
            alt={`${title} 대표 이미지`}
            width={600}
            height={600}
            priority
            className="aspect-square w-full object-cover"
            sizes="(max-width: 430px) 100vw, 430px"
          />
        ) : (
          <ImagePlaceholder
            className="aspect-square w-full rounded-none"
            label={primaryImage ? `${title} 대표 이미지` : "이미지 없음"}
          />
        )}
      </div>

      {/* 썸네일 가로 스크롤 줄 */}
      {thumbnails.length > 1 && (
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-3"
          aria-label="상품 이미지 목록"
          role="list"
        >
          {thumbnails.map((img, idx) => (
            <div
              key={img.id}
              role="listitem"
              className="shrink-0"
              aria-label={`이미지 ${idx + 1}`}
            >
              {/* TODO: Phase 3 — 클릭 시 대표 이미지 전환 인터랙션 추가 */}
              {img.url ? (
                <Image
                  src={img.url}
                  alt={`${title} 이미지 ${idx + 1}`}
                  width={64}
                  height={64}
                  className={
                    img.isPrimary
                      ? "size-16 rounded-md object-cover ring-2 ring-foreground"
                      : "size-16 rounded-md object-cover ring-1 ring-border"
                  }
                />
              ) : (
                <ImagePlaceholder
                  className={
                    // 대표 이미지 썸네일에 선택 표시 (테두리 강조)
                    img.isPrimary
                      ? "size-16 rounded-md ring-2 ring-foreground"
                      : "size-16 rounded-md ring-1 ring-border"
                  }
                  label={`${title} 이미지 ${idx + 1}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
