"use client";

// 경매 상품 정보 수정 폼 (Client Component)
// 판매자 본인만, active 상품에 대해 "사진 / 설명 / 즉시구매가"만 수정한다.
// 제목·시작가·카테고리·지역·마감 시각은 경매 공정성상 잠금(읽기 전용 표시).
// 제출 시 updateAuction(상품 update + 이미지 reconcile + 대표 재설정)을 호출한다.

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { isAllowedImageFile } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImagePlaceholder } from "@/components/common/image-placeholder";
import { updateAuction, type PrimarySelection } from "@/lib/mutations/auctions";
import type { AuctionDetail } from "@/lib/types";

// 이미지 최대 등록 개수 (등록 폼과 동일: 대표 1 + 추가 5)
const IMAGE_SLOT_COUNT = 6;

// 입력 문자열에서 숫자만 남긴다 (콤마·공백 등 제거)
const onlyDigits = (value: string) => value.replace(/[^\d]/g, "");

// 숫자 문자열을 3자리마다 콤마 찍어 표시용으로 변환 (빈 값이면 빈 문자열)
const formatWithComma = (digits: string) =>
  digits === "" ? "" : Number(digits).toLocaleString("ko-KR");

// 편집 중 이미지 항목 — 기존(서버 저장) 또는 새로 선택(미업로드) 두 종류.
// 배열 순서가 표시 순서이며, 첫 번째 항목이 대표 이미지가 된다.
type EditImage =
  | { kind: "existing"; id: string; url: string }
  | { kind: "new"; file: File; preview: string };

interface AuctionEditFormProps {
  /** 수정 대상 경매 상세 (초기값 바인딩용) */
  detail: AuctionDetail;
}

export function AuctionEditForm({ detail }: AuctionEditFormProps) {
  const router = useRouter();

  // 파일 선택 input ref — 추가 슬롯 클릭 시 시스템 파일 다이얼로그 연결용
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== 이미지 상태 =====
  // 초기값: 기존 이미지를 대표 우선으로 정렬해 로드 (대표가 목록 첫 장이 되도록).
  const [images, setImages] = useState<EditImage[]>(() =>
    [...detail.images]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((img) => ({ kind: "existing", id: img.id, url: img.url }) as const)
  );
  // 이미지 선택 관련 안내(검증 거부/개수 초과 등). 없으면 null.
  const [imageNotice, setImageNotice] = useState<string | null>(null);

  // ===== 텍스트/가격 상태 =====
  const [description, setDescription] = useState(detail.description ?? "");
  const [buyNowPrice, setBuyNowPrice] = useState(
    detail.buyNowPrice === null ? "" : String(detail.buyNowPrice)
  );
  const [buyNowError, setBuyNowError] = useState<string | null>(null);

  // ===== 제출 상태 =====
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // 저장 성공 + 일부 이미지 업로드 실패 시 결과(상세 이동 링크 제공). 없으면 null.
  const [partialResult, setPartialResult] = useState<{
    failedCount: number;
  } | null>(null);

  // 파일 선택 → 타입/용량 검증 후 미리보기 생성 (최대 IMAGE_SLOT_COUNT 장)
  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const picked = Array.from(fileList);
    const valid = picked.filter(isAllowedImageFile);
    const rejected = picked.length - valid.length;

    setImages((prev) => {
      const room = IMAGE_SLOT_COUNT - prev.length;
      const overflow = Math.max(0, valid.length - Math.max(0, room));
      const added = valid.slice(0, Math.max(0, room)).map(
        (file) =>
          ({
            kind: "new",
            file,
            preview: URL.createObjectURL(file),
          }) as const
      );

      const notices: string[] = [];
      if (rejected > 0)
        notices.push(
          `${rejected}개 파일은 JPG/PNG/WEBP/GIF·5MB 이하만 가능하여 제외했습니다.`
        );
      if (overflow > 0)
        notices.push(`최대 ${IMAGE_SLOT_COUNT}장까지만 등록할 수 있습니다.`);
      setImageNotice(notices.length > 0 ? notices.join(" ") : null);

      return [...prev, ...added];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 이미지 제거 (새 이미지면 미리보기 URL 해제)
  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target && target.kind === "new") URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
    setImageNotice(null);
    if (saveError) setSaveError(null);
  };

  // 제출 처리 — 검증 통과 후 updateAuction 호출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setBuyNowError(null);

    // 1) 이미지 최소 1장 검증
    if (images.length === 0) {
      setSaveError("상품 이미지는 최소 1장 이상 등록해야 합니다.");
      return;
    }

    // 2) 즉시구매가 검증 — 입력된 경우에만. 입찰이 붙었을 수 있어 현재가 초과를 강제한다.
    let buyNowValue: number | null = null;
    if (buyNowPrice.trim() !== "") {
      const parsed = Number(buyNowPrice);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setBuyNowError("즉시구매가를 올바르게 입력해 주세요.");
        return;
      }
      if (parsed <= detail.currentPrice) {
        setBuyNowError(
          `즉시구매가는 현재가(${formatPrice(detail.currentPrice)})보다 높아야 합니다.`
        );
        return;
      }
      buyNowValue = parsed;
    }

    // 3) 이미지 diff 계산
    // 삭제 대상: 기존 이미지 중 현재 목록에 남지 않은 것
    const keptExistingIds = new Set(
      images
        .filter((img) => img.kind === "existing")
        .map((img) => (img as Extract<EditImage, { kind: "existing" }>).id)
    );
    const removedImages = detail.images
      .filter((img) => !keptExistingIds.has(img.id))
      .map((img) => ({ id: img.id, url: img.url }));

    // 추가 대상: 새로 선택한 파일 (목록 순서 유지)
    const newImages = images.filter(
      (img): img is Extract<EditImage, { kind: "new" }> => img.kind === "new"
    );
    const newFiles = newImages.map((img) => img.file);

    // 대표: 목록 첫 장 (등록 폼과 동일 규칙)
    const first = images[0];
    let primary: PrimarySelection;
    if (first.kind === "existing") {
      primary = { kind: "existing", id: first.id };
    } else {
      // 첫 장이 새 파일이면 newFiles 내 인덱스를 지정
      primary = { kind: "new", index: newImages.indexOf(first) };
    }

    setIsSaving(true);
    try {
      const { failedCount } = await updateAuction({
        productId: detail.id,
        description: description.trim() === "" ? null : description.trim(),
        buyNowPrice: buyNowValue,
        removedImages,
        newFiles,
        primary,
      });

      // 일부 이미지 업로드 실패 시: 텍스트는 저장됨 → 재제출(중복) 대신 상세 이동 안내
      if (failedCount > 0) {
        setIsSaving(false);
        setPartialResult({ failedCount });
        return;
      }
      router.push(`/auctions/${detail.id}`);
      router.refresh();
    } catch (error) {
      setIsSaving(false);
      setSaveError(
        error instanceof Error
          ? error.message
          : "상품 정보 수정 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-label="상품 정보 수정 폼"
      noValidate
    >
      {/* ===== 1. 이미지 편집 ===== */}
      <div className="space-y-2">
        <Label>상품 이미지</Label>

        {/* 숨김 파일 입력 — 선택 시 미리보기 생성, 제출 시 Storage 업로드 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          aria-label="상품 이미지 파일 선택"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* 이미지 미리보기 그리드 (3열) — 기존/새 이미지 혼합 + 추가 슬롯 */}
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="이미지 슬롯"
        >
          {images.map((img, index) => (
            <div
              key={img.kind === "existing" ? img.id : img.preview}
              className="relative"
            >
              <div className="aspect-square w-full overflow-hidden rounded-md border">
                {/* 기존/새 이미지 모두 미리보기라 next/image 미사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.kind === "existing" ? img.url : img.preview}
                  alt={`상품 이미지 ${index + 1}`}
                  className="size-full object-cover"
                />
              </div>

              {/* 첫 번째 이미지에 "대표" 배지 표시 */}
              {index === 0 && (
                <Badge
                  variant="default"
                  className="pointer-events-none absolute left-1 top-1 text-xs"
                >
                  대표
                </Badge>
              )}

              {/* 이미지 제거 버튼 */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`상품 이미지 ${index + 1} 제거`}
                className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ))}

          {/* 추가 업로드 슬롯 (최대 개수 미만일 때만) */}
          {images.length < IMAGE_SLOT_COUNT && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full overflow-hidden rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                images.length === 0
                  ? "border-2 border-dashed border-muted-foreground hover:border-ring"
                  : "border border-dashed border-input hover:border-ring"
              )}
              aria-label={
                images.length === 0
                  ? "대표 이미지 업로드"
                  : "이미지 추가 업로드"
              }
            >
              <ImagePlaceholder
                className="aspect-square w-full rounded-md"
                label={images.length === 0 ? "대표 이미지 추가" : "이미지 추가"}
              />
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          첫 번째 이미지가 대표 이미지로 사용됩니다. 최대 6장까지 등록
          가능합니다.
        </p>

        {imageNotice && (
          <p
            className="text-xs font-medium text-destructive"
            role="alert"
            aria-live="polite"
          >
            {imageNotice}
          </p>
        )}
      </div>

      {/* ===== 2. 상품 설명 ===== */}
      <div className="space-y-2">
        <Label htmlFor="edit-description">상품 설명</Label>
        <Textarea
          id="edit-description"
          placeholder="상품의 상태, 사용 기간, 구매 시기 등을 자세히 적어주세요."
          rows={5}
          className="resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* ===== 3. 즉시구매가 (선택) ===== */}
      <div className="space-y-2">
        <Label htmlFor="edit-buy-now-price">즉시구매가(원) · 선택</Label>
        <Input
          id="edit-buy-now-price"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formatWithComma(buyNowPrice)}
          onChange={(e) => {
            setBuyNowPrice(onlyDigits(e.target.value));
            if (buyNowError) setBuyNowError(null);
          }}
          aria-invalid={buyNowError !== null}
          aria-describedby="edit-buy-now-hint"
        />
        <p id="edit-buy-now-hint" className="text-xs text-muted-foreground">
          현재가({formatPrice(detail.currentPrice)})보다 높아야 하며, 비우면
          즉시구매가 해제됩니다.
        </p>
        {buyNowError && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {buyNowError}
          </p>
        )}
      </div>

      <Separator />

      {/* ===== 4. 읽기 전용 정보 (수정 불가 항목) ===== */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          아래 항목은 경매 공정성을 위해 수정할 수 없습니다.
        </p>
        <dl className="space-y-1.5 rounded-md bg-muted/40 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">제목</dt>
            <dd className="truncate font-medium text-foreground">
              {detail.title}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">카테고리</dt>
            <dd className="font-medium text-foreground">
              {detail.categoryLabel}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">직거래 지역</dt>
            <dd className="font-medium text-foreground">{detail.region}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">시작가</dt>
            <dd className="font-medium text-foreground">
              {formatPrice(detail.startPrice)}
            </dd>
          </div>
        </dl>
      </div>

      {/* ===== 5. 저장 실패 안내 ===== */}
      {saveError && (
        <p
          className="text-sm font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {saveError}
        </p>
      )}

      {/* ===== 6. 저장 버튼 / 부분 실패 결과 ===== */}
      {partialResult ? (
        // 텍스트는 저장됨 + 일부 이미지 실패 → 중복 저장 방지 위해 상세 이동 링크만 제공
        <div
          className="space-y-3 rounded-md border bg-muted/40 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-foreground">
            상품 정보가 저장되었습니다. 다만 이미지 {partialResult.failedCount}
            장 업로드에 실패했습니다.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href={`/auctions/${detail.id}`}>상세로 이동</Link>
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1"
            aria-disabled={isSaving}
          >
            <Link href={`/auctions/${detail.id}`}>취소</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      )}
    </form>
  );
}
