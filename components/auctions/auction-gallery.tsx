"use client";

// 경매 상품 이미지 갤러리 컴포넌트 (Client Component)
// 대표 이미지 1장(큰 영역) + 하단 썸네일 가로 스크롤 줄로 구성한다.
// 썸네일을 클릭하면 큰 영역이 해당 이미지로 전환된다(선택 상태 관리).
// url이 있으면 next/image, 없으면 ImagePlaceholder로 표시한다(T052 실 이미지 연동).

import { useState } from "react";
import { ImagePlaceholder } from "@0625chopin/shared/common/image-placeholder";
import { ProductImage as ProductImageView } from "@0625chopin/shared/common/product-image";
import { cn } from "@0625chopin/shared/utils";
import type { ProductImage } from "@0625chopin/shared/types";

// 썸네일 공통 크기/모서리 클래스 — 선택 상태에 따른 링 강조만 cn()으로 덧붙인다.
const THUMBNAIL_BASE_CLASS = "size-16 rounded-md";

interface AuctionGalleryProps {
  /** 상품 이미지 목록 (isPrimary: true가 대표 이미지) */
  images: ProductImage[];
  /** 접근성 alt 텍스트 기반 */
  title: string;
}

export function AuctionGallery({ images, title }: AuctionGalleryProps) {
  // 초기 선택: isPrimary가 true인 이미지, 없으면 첫 번째(0)
  // lazy init(useState(() => ...))으로 매 렌더마다 재계산되지 않도록 한다.
  // 큰 영역에 표시할 이미지의 인덱스 — 썸네일 클릭으로 전환된다.
  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(
      images.findIndex((img) => img.isPrimary),
      0
    )
  );

  // 현재 선택된 이미지(대표 영역에 표시)
  const selectedImage = images[selectedIndex] ?? images[0];
  // 썸네일 목록: 전체 이미지(대표 포함 최대 표시)
  const thumbnails = images;

  return (
    <section aria-label={`${title} 상품 이미지`} className="w-full">
      {/* 대표(선택) 이미지 영역 — 정사각형 전체 폭 */}
      <div className="w-full overflow-hidden">
        {selectedImage && selectedImage.url ? (
          <ProductImageView
            src={selectedImage.url}
            alt={`${title} 이미지 ${selectedIndex + 1}`}
            width={600}
            height={600}
            priority
            className="aspect-square w-full object-cover"
            sizes="(max-width: 430px) 100vw, 430px"
            placeholderClassName="aspect-square w-full rounded-none"
          />
        ) : (
          <ImagePlaceholder
            className="aspect-square w-full rounded-none"
            label={selectedImage ? `${title} 이미지` : "이미지 없음"}
          />
        )}
      </div>

      {/* 썸네일 가로 스크롤 줄 */}
      {thumbnails.length > 1 && (
        <div
          className="flex scrollbar-none gap-2 overflow-x-auto px-4 py-3"
          aria-label="상품 이미지 목록"
          role="list"
        >
          {thumbnails.map((img, idx) => {
            // 현재 큰 영역에 표시 중인 썸네일 여부(선택 강조 기준)
            const isSelected = idx === selectedIndex;
            return (
              <div key={img.id} role="listitem" className="shrink-0">
                {/* 클릭 시 대표 이미지 영역을 해당 이미지로 전환 */}
                <button
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  aria-label={`이미지 ${idx + 1} 크게 보기`}
                  aria-current={isSelected}
                  className="focus-visible:ring-ring block rounded-md focus-visible:ring-2 focus-visible:outline-none"
                >
                  {/* 선택 여부에 따른 링 강조 클래스 — 공통 크기/모서리(THUMBNAIL_BASE_CLASS)는
                      cn()으로 한 번만 정의하고 상태별 링 스타일만 덧붙인다. */}
                  {img.url ? (
                    <ProductImageView
                      src={img.url}
                      alt={`${title} 이미지 ${idx + 1}`}
                      width={64}
                      height={64}
                      className={cn(
                        THUMBNAIL_BASE_CLASS,
                        "object-cover",
                        isSelected
                          ? "ring-foreground ring-2"
                          : "ring-border ring-1"
                      )}
                      placeholderClassName={cn(
                        THUMBNAIL_BASE_CLASS,
                        isSelected
                          ? "ring-2 ring-foreground"
                          : "ring-1 ring-border"
                      )}
                    />
                  ) : (
                    <ImagePlaceholder
                      className={cn(
                        THUMBNAIL_BASE_CLASS,
                        isSelected
                          ? "ring-foreground ring-2"
                          : "ring-border ring-1"
                      )}
                      label={`${title} 이미지 ${idx + 1}`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
