// 경매 상품 정보 컴포넌트 (RSC)
// 제목, 상태 배지, 카테고리/중고등급/지역, 가격 정보, 마감 시간, 입찰 수를 표시한다.
// Separator로 정보 구역을 시각적으로 구분한다.
// 낙찰(won)/유찰(failed) 상태는 강조 배너로 별도 표시한다.

import { Gavel, MapPin, Tag } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { RemainingTime } from "@/components/common/remaining-time";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuctionDetail } from "@/lib/types";

interface AuctionInfoProps {
  /** 경매 상세 데이터 */
  detail: AuctionDetail;
}

export function AuctionInfo({ detail }: AuctionInfoProps) {
  // 중고등급 표시 라벨 (DB 공통코드에서 조회해 detail에 주입됨)
  const conditionLabel = detail.conditionLabel;

  // 종료 상태 여부 판별 (낙찰/유찰)
  const isWon = detail.status === "won";
  const isFailed = detail.status === "failed";
  const isEnded = isWon || isFailed;

  return (
    <article className="w-full space-y-4 px-4 py-5">
      {/* ===== 상태 배지 + 제목 ===== */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusBadge
            kind="product"
            status={detail.status}
            label={detail.statusLabel}
          />
          {/* 종료 상태 강조 배너 (낙찰/유찰) */}
          {isEnded && (
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-xs font-semibold",
                isWon
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
              aria-live="polite"
            >
              {isWon ? "낙찰 완료" : "유찰 종료"}
            </span>
          )}
        </div>

        {/* 상품 제목 */}
        <h1 className="text-xl font-bold leading-snug text-foreground">
          {detail.title}
        </h1>
      </div>

      {/* ===== 메타 정보: 카테고리·중고등급·지역 ===== */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
        aria-label="상품 정보"
      >
        {/* 카테고리 */}
        <span className="flex items-center gap-1">
          <Tag className="size-3 shrink-0" aria-hidden="true" />
          {detail.categoryLabel}
        </span>

        <span aria-hidden="true" className="select-none text-border">
          ·
        </span>

        {/* 중고등급 */}
        <span>{conditionLabel}</span>

        <span aria-hidden="true" className="select-none text-border">
          ·
        </span>

        {/* 지역 */}
        <span className="flex items-center gap-1">
          <MapPin className="size-3 shrink-0" aria-hidden="true" />
          {detail.region}
        </span>
      </div>

      <Separator />

      {/* ===== 가격 정보 ===== */}
      <div className="space-y-3">
        {/* 현재가 (강조) */}
        <div>
          <p className="text-xs text-muted-foreground">현재가</p>
          <p
            className="text-2xl font-bold text-foreground"
            aria-label={`현재가 ${formatPrice(detail.currentPrice)}`}
          >
            {formatPrice(detail.currentPrice)}
          </p>
        </div>

        {/* 즉시구매가 (있을 때만 표시) */}
        {detail.buyNowPrice !== null && (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <p className="text-sm text-muted-foreground">즉시구매가</p>
            <p
              className="text-sm font-semibold text-foreground"
              aria-label={`즉시구매가 ${formatPrice(detail.buyNowPrice)}`}
            >
              {formatPrice(detail.buyNowPrice)}
            </p>
          </div>
        )}
      </div>

      {/* ===== 상품 설명 (입력된 경우에만 표시) ===== */}
      {detail.description && detail.description.trim() !== "" && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">상품 설명</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {detail.description}
            </p>
          </div>
        </>
      )}

      <Separator />

      {/* ===== 경매 진행 정보: 마감 시간·입찰 수·시작가 ===== */}
      <div className="space-y-2">
        {/* 마감까지 남은 시간 — 클라이언트 컴포넌트 (hydration mismatch 방지) */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">마감</span>
          <RemainingTime endsAt={detail.auctionEndsAt} />
        </div>

        {/* 입찰 수 */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Gavel className="size-3 shrink-0" aria-hidden="true" />
            입찰
          </span>
          <span
            className="text-sm font-medium text-foreground"
            aria-label={`${detail.bidCount}회 입찰`}
          >
            {detail.bidCount}회
          </span>
        </div>

        {/* 시작가 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">시작가</span>
          <span className="text-sm text-muted-foreground">
            {formatPrice(detail.startPrice)}
          </span>
        </div>
      </div>
    </article>
  );
}
