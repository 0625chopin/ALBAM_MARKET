"use client";

// 경매 등록 폼 컴포넌트 (T024 마크업 + T031 인터랙션 + T052 실등록)
// T052: 제출 시 Supabase products insert + Storage(product-images) 업로드 + product_images insert.
//       이미지 슬롯은 실제 선택 파일 미리보기로 동작하며, 첫 장이 대표 이미지가 된다.
//       검증 로직(필수값, 즉시구매가>시작가)과 폼 구조는 유지한다.

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAllowedImageFile } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImagePlaceholder } from "@/components/common/image-placeholder";
import type { SelectOption } from "@/lib/types";
import { createAuction } from "@/lib/mutations/auctions";
import { DEFAULT_AUCTION_DURATION_HOURS } from "@/lib/constants/auctions";

// 이미지 최대 등록 개수 (대표 1 + 추가 5)
const IMAGE_SLOT_COUNT = 6;

// 입력 문자열에서 숫자만 남긴다 (콤마·공백 등 제거)
const onlyDigits = (value: string) => value.replace(/[^\d]/g, "");

// 숫자 문자열을 3자리마다 콤마 찍어 표시용으로 변환 (빈 값이면 빈 문자열)
const formatWithComma = (digits: string) =>
  digits === "" ? "" : Number(digits).toLocaleString("ko-KR");

// 지금부터 hours 시간 뒤의 예상 마감 시각을 한국어 로컬 포맷으로 반환 (안내 표시용)
const formatExpectedEndAt = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// 폼 필드별 검증 에러 키
interface FormErrors {
  title?: string;
  category?: string;
  region?: string;
  condition?: string;
  startPrice?: string;
  buyNowPrice?: string;
}

// ===== Props 타입 =====
// 옵션 목록은 호출부(서버 페이지 DB 조회 / /sample Mock)가 반드시 주입한다(무폴백).
interface AuctionFormProps {
  /** 카테고리 옵션 (value=slug) */
  categories: SelectOption[];
  /** 직거래 지역 옵션 (value=코드, label=한글) */
  regions: SelectOption[];
  /** 중고등급 옵션 */
  conditions: SelectOption[];
  /** 경매 진행 시간 옵션 (value=시간 문자열, label=표시명) — 공통코드 codes.auction_duration 주입 */
  durationOptions: SelectOption[];
  /** 기본 경매 진행 시간(시간) — 진행 시간 Select 의 초기 선택값 소스 (codes.policy.default_auction_duration_hours 주입) */
  auctionDurationHours: number;
  /** 누적 패널티 이용 제한 여부 (ISSUE-004) — true면 등록 차단 */
  restricted?: boolean;
  /** 집계 기간 이내 누적 패널티 수 (안내 표시용) */
  penaltyCount?: number;
  /** 이용 제한 임계값(회) */
  penaltyThreshold?: number;
  /** 패널티 누적 집계 기간(일) */
  penaltyWindowDays?: number;
}

export function AuctionForm({
  categories,
  regions,
  conditions,
  durationOptions,
  auctionDurationHours,
  restricted = false,
  penaltyCount = 0,
  penaltyThreshold = 0,
  penaltyWindowDays = 0,
}: AuctionFormProps) {
  const router = useRouter();

  // 파일 선택 input ref — 업로드 버튼 클릭 시 시스템 파일 다이얼로그 연결용
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== 폼 필드 상태 =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [condition, setCondition] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  // 경매 진행 시간(시간). shadcn Select 는 문자열 value 를 사용한다.
  // 초기값: 정책 기본값(auctionDurationHours)이 옵션에 있으면 그 값,
  //         없으면 기본 상수(24)가 옵션에 있으면 그 값, 그것도 없으면 첫 옵션.
  const [durationHours, setDurationHours] = useState<string>(() => {
    const has = (hours: number) =>
      durationOptions.some((option) => option.value === String(hours));
    if (has(auctionDurationHours)) return String(auctionDurationHours);
    if (has(DEFAULT_AUCTION_DURATION_HOURS))
      return String(DEFAULT_AUCTION_DURATION_HOURS);
    return durationOptions[0]?.value ?? String(DEFAULT_AUCTION_DURATION_HOURS);
  });

  // 선택된 이미지 파일 + 미리보기 URL (첫 장이 대표 이미지)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  // 이미지 선택 관련 안내(검증 거부/개수 초과 등). 없으면 null.
  const [imageNotice, setImageNotice] = useState<string | null>(null);

  // ===== 검증/제출 상태 =====
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 등록 성공 + 일부 이미지 업로드 실패 시 결과(상세 이동 링크 제공). 없으면 null.
  const [partialResult, setPartialResult] = useState<{
    productId: string;
    failedCount: number;
  } | null>(null);

  // 파일 선택 → 타입/용량 검증 후 미리보기 생성 (최대 IMAGE_SLOT_COUNT 장)
  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    // 허용 타입(jpeg/png/webp/gif)·용량(5MB) 검증 — 위반 파일은 제외하고 사유 안내
    const picked = Array.from(fileList);
    const valid = picked.filter(isAllowedImageFile);
    const rejected = picked.length - valid.length;

    setImages((prev) => {
      const room = IMAGE_SLOT_COUNT - prev.length;
      const overflow = Math.max(0, valid.length - Math.max(0, room));
      const added = valid
        .slice(0, Math.max(0, room))
        .map((file) => ({ file, preview: URL.createObjectURL(file) }));

      // 안내 메시지 구성 (거부/초과)
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
    // 동일 파일 재선택 가능하도록 input 값 초기화
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 선택 이미지 제거 (미리보기 URL 해제)
  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 폼 검증 — 통과 시 빈 객체 반환
  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (title.trim() === "") next.title = "제목을 입력해 주세요.";
    if (category === "") next.category = "카테고리를 선택해 주세요.";
    if (region === "") next.region = "직거래 지역을 선택해 주세요.";
    if (condition === "") next.condition = "중고등급을 선택해 주세요.";

    const start = Number(startPrice);
    if (startPrice.trim() === "" || !Number.isFinite(start) || start <= 0) {
      next.startPrice = "시작가를 0보다 크게 입력해 주세요.";
    }

    // 즉시구매가는 선택값 — 입력된 경우에만 시작가보다 큰지 검증
    if (buyNowPrice.trim() !== "") {
      const buyNow = Number(buyNowPrice);
      if (!Number.isFinite(buyNow) || buyNow <= 0) {
        next.buyNowPrice = "즉시구매가를 올바르게 입력해 주세요.";
      } else if (Number.isFinite(start) && buyNow <= start) {
        next.buyNowPrice = "즉시구매가는 시작가보다 높아야 합니다.";
      }
    }

    return next;
  };

  // 제출 처리 — 검증 통과 후 Supabase 실등록(상품 insert + 이미지 업로드) (T052)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // ISSUE-004: 누적 패널티 이용 제한 시 등록 차단(서버 트리거가 최종 강제, 여기선 UX 사전차단)
    if (restricted) {
      setSubmitError(
        `누적 패널티로 경매 등록이 제한되었습니다. (최근 ${penaltyWindowDays}일 ${penaltyCount}건)`
      );
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    // 선택값(value) → 저장용 라벨/값 변환
    const regionLabel =
      regions.find((opt) => opt.value === region)?.label ?? region;

    setIsSubmitting(true);
    try {
      const { productId, failedCount } = await createAuction({
        title: title.trim(),
        description: description.trim() === "" ? null : description.trim(),
        categorySlug: category,
        regionLabel,
        condition,
        startPrice: Number(startPrice),
        buyNowPrice: buyNowPrice.trim() === "" ? null : Number(buyNowPrice),
        durationHours: Number(durationHours),
        files: images.map((img) => img.file),
      });

      // 일부 이미지 업로드 실패 시: 상품은 등록되었으므로 재등록(중복) 대신
      // 결과 안내 + 상세 이동 링크를 제공한다. 전부 성공이면 즉시 상세로 이동.
      if (failedCount > 0) {
        setIsSubmitting(false);
        setPartialResult({ productId, failedCount });
        return;
      }
      router.push(`/auctions/${productId}`);
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "경매 등록 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-label="경매 등록 폼"
      noValidate
    >
      {/* ===== 0. 이용 제한 안내 (ISSUE-004: 누적 패널티) ===== */}
      {restricted && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          최근 {penaltyWindowDays}일간 누적 패널티가 {penaltyCount}건(제한 기준{" "}
          {penaltyThreshold}건)이라 경매 등록이 제한되었습니다. 기간이 지나면
          다시 등록할 수 있습니다.
        </div>
      )}

      {/* ===== 1. 이미지 업로드 UI ===== */}
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

        {/* 이미지 미리보기 그리드 (3열) — 선택 파일 미리보기 + 추가 슬롯 */}
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="이미지 슬롯"
        >
          {images.map((img, index) => (
            <div key={img.preview} className="relative">
              <div className="aspect-square w-full overflow-hidden rounded-md border">
                {/* 미리보기는 ObjectURL 이라 next/image 미사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
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

        {/* 이미지 등록 안내 텍스트 */}
        <p className="text-xs text-muted-foreground">
          첫 번째 이미지가 대표 이미지로 사용됩니다. 최대 6장까지 등록
          가능합니다.
        </p>

        {/* 선택 검증 안내(거부/초과) */}
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

      {/* ===== 2. 제목 ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-title">제목</Label>
        <Input
          id="auction-title"
          type="text"
          placeholder="상품 제목"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={errors.title !== undefined}
          aria-describedby={errors.title ? "auction-title-error" : undefined}
        />
        {errors.title && (
          <p
            id="auction-title-error"
            className="text-xs font-medium text-destructive"
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* ===== 3. 상품 설명 ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-description">상품 설명</Label>
        <Textarea
          id="auction-description"
          placeholder="상품의 상태, 사용 기간, 구매 시기 등을 자세히 적어주세요."
          rows={5}
          className="resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* ===== 4. 카테고리 ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-category">카테고리</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            id="auction-category"
            className="w-full"
            aria-invalid={errors.category !== undefined}
          >
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {/* ===== 5. 직거래 지역 ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-region">직거래 지역</Label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger
            id="auction-region"
            className="w-full"
            aria-invalid={errors.region !== undefined}
          >
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.region && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.region}
          </p>
        )}
      </div>

      {/* ===== 6. 중고등급 ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-condition">중고등급</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger
            id="auction-condition"
            className="w-full"
            aria-invalid={errors.condition !== undefined}
          >
            <SelectValue placeholder="상품 상태 선택" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.condition && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.condition}
          </p>
        )}
      </div>

      {/* ===== 7. 시작가 ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-start-price">시작가(원)</Label>
        <Input
          id="auction-start-price"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formatWithComma(startPrice)}
          onChange={(e) => setStartPrice(onlyDigits(e.target.value))}
          aria-invalid={errors.startPrice !== undefined}
        />
        {errors.startPrice && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.startPrice}
          </p>
        )}
      </div>

      {/* ===== 8. 즉시구매가(선택) ===== */}
      <div className="space-y-2">
        <Label htmlFor="auction-buy-now-price">즉시구매가(원) · 선택</Label>
        <Input
          id="auction-buy-now-price"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formatWithComma(buyNowPrice)}
          onChange={(e) => setBuyNowPrice(onlyDigits(e.target.value))}
          aria-invalid={errors.buyNowPrice !== undefined}
          aria-describedby="buy-now-hint"
        />
        {/* 즉시구매가 입력 정적 힌트 */}
        <p id="buy-now-hint" className="text-xs text-muted-foreground">
          즉시구매가는 시작가보다 높아야 합니다.
        </p>
        {errors.buyNowPrice && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {errors.buyNowPrice}
          </p>
        )}
      </div>

      {/* ===== 9. 경매 진행 시간 선택 ===== */}
      {/* 등록자가 진행 시간을 선택한다. 선택값 기준 now()+N시간을 마감 시각으로 저장한다.
          (createAuction 이 auction_ends_at 을 명시 전달) */}
      <div className="space-y-2">
        <Label htmlFor="auction-duration">경매 진행 시간</Label>
        <Select value={durationHours} onValueChange={setDurationHours}>
          <SelectTrigger id="auction-duration" className="w-full">
            <SelectValue placeholder="진행 시간 선택" />
          </SelectTrigger>
          <SelectContent>
            {durationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* 선택값 기준 예상 마감 시각 안내 */}
        <p className="text-xs text-muted-foreground">
          등록 시점부터 선택한 시간 후 마감됩니다. 예상 마감:{" "}
          <span className="font-medium text-foreground">
            {formatExpectedEndAt(Number(durationHours))}
          </span>
        </p>
      </div>

      {/* ===== 10. 제출 실패 안내 ===== */}
      {submitError && (
        <p
          className="text-sm font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {submitError}
        </p>
      )}

      {/* ===== 11. 등록 버튼 / 부분 실패 결과 ===== */}
      {partialResult ? (
        // 상품은 등록됨 + 일부 이미지 실패 → 중복 등록 방지 위해 상세 이동 링크만 제공
        <div
          className="space-y-3 rounded-md border bg-muted/40 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-foreground">
            상품이 등록되었습니다. 다만 이미지 {partialResult.failedCount}장
            업로드에 실패했습니다.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href={`/auctions/${partialResult.productId}`}>
              등록한 경매 보기
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || restricted}
          aria-busy={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? "등록 중..." : "경매 등록"}
        </Button>
      )}
    </form>
  );
}
