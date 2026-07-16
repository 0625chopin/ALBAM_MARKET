"use client";

// 상품 등록/수정 폼 공용 이미지 슬롯 그리드 (프레젠테이션 전용)
// auction-form(등록)과 auction-edit-form(수정)의 이미지 슬롯 마크업이 key/src 표현식만
// 다르고 완전히 동일하여 이 컴포넌트로 추출한다. 상태(선택/제거/대표 판정/diff 계산)는
// 각 폼이 그대로 보유하고, 이 컴포넌트는 정규화된 슬롯 목록(key/src)과 콜백만 받아 렌더한다.
// 즉 동작/로직 변경 없이 중복 마크업만 제거한다.

import type { RefObject } from "react";
import { X } from "lucide-react";
import { cn } from "@0625chopin/shared/utils";
import { Badge } from "@0625chopin/shared/ui/badge";
import { ImagePlaceholder } from "@0625chopin/shared/common/image-placeholder";
import { IMAGE_SLOT_COUNT } from "@/lib/utils/product-form";

/** 이미지 슬롯 1칸의 표시 데이터 — 폼별 상태(신규/기존)를 정규화한 결과 */
export interface ImageSlot {
  /** React key — 신규 이미지는 preview(ObjectURL), 기존 이미지는 저장된 id */
  key: string;
  /** 미리보기 src — 신규는 ObjectURL, 기존은 저장된 url */
  src: string;
}

interface ImageSlotGridProps {
  /** 표시할 이미지 슬롯 목록 (배열 첫 장이 대표 이미지) */
  slots: ImageSlot[];
  /** 숨김 파일 입력 ref (추가 슬롯 클릭 시 트리거) */
  fileInputRef: RefObject<HTMLInputElement | null>;
  /** 파일 선택 시 호출 */
  onFilesSelected: (files: FileList | null) => void;
  /** index번째 슬롯 제거 시 호출 */
  onRemove: (index: number) => void;
}

export function ImageSlotGrid({
  slots,
  fileInputRef,
  onFilesSelected,
  onRemove,
}: ImageSlotGridProps) {
  return (
    <>
      {/* 숨김 파일 입력 — 선택 시 미리보기 생성, 제출 시 Storage 업로드 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        aria-label="상품 이미지 파일 선택"
        onChange={(e) => onFilesSelected(e.target.files)}
      />

      {/* 이미지 미리보기 그리드 (3열) — 미리보기 + 추가 슬롯 */}
      <div
        className="grid grid-cols-3 gap-2"
        role="group"
        aria-label="이미지 슬롯"
      >
        {slots.map((slot, index) => (
          <div key={slot.key} className="relative">
            <div className="aspect-square w-full overflow-hidden rounded-md border">
              {/* 미리보기는 ObjectURL/저장 URL 혼용이라 next/image 미사용 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.src}
                alt={`상품 이미지 ${index + 1}`}
                className="size-full object-cover"
              />
            </div>

            {/* 첫 번째 이미지에 "대표" 배지 표시 */}
            {index === 0 && (
              <Badge
                variant="default"
                className="pointer-events-none absolute top-1 left-1 text-xs"
              >
                대표
              </Badge>
            )}

            {/* 이미지 제거 버튼 */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`상품 이미지 ${index + 1} 제거`}
              className="bg-foreground/70 text-background hover:bg-foreground focus-visible:ring-ring absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}

        {/* 추가 업로드 슬롯 (최대 개수 미만일 때만) */}
        {slots.length < IMAGE_SLOT_COUNT && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full overflow-hidden rounded-md transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
              slots.length === 0
                ? "border-muted-foreground hover:border-ring border-2 border-dashed"
                : "border-input hover:border-ring border border-dashed"
            )}
            aria-label={
              slots.length === 0 ? "대표 이미지 업로드" : "이미지 추가 업로드"
            }
          >
            <ImagePlaceholder
              className="aspect-square w-full rounded-md"
              label={slots.length === 0 ? "대표 이미지 추가" : "이미지 추가"}
            />
          </button>
        )}
      </div>

      {/* 이미지 등록 안내 텍스트 */}
      <p className="text-muted-foreground text-xs">
        첫 번째 이미지가 대표 이미지로 사용됩니다. 최대 6장까지 등록 가능합니다.
      </p>
    </>
  );
}
