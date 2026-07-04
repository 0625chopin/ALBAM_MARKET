// 경매 상품 정보 컴포넌트 (RSC)
// 제목, 상태 배지, 카테고리/중고등급/지역, 가격 정보, 마감 시간, 입찰 수를 표시한다.
// Separator로 정보 구역을 시각적으로 구분한다.
// 낙찰(won)/유찰(failed) 상태는 강조 배너로 별도 표시한다.

import { Gavel, MapPin, Tag } from "lucide-react";
import { StatusBadge } from "@0625chopin/shared/common/status-badge";
import { RemainingTime } from "@0625chopin/shared/common/remaining-time";
import { Separator } from "@0625chopin/shared/ui/separator";
import { formatPrice } from "@0625chopin/shared/format";
import { cn } from "@0625chopin/shared/utils";
import type { AuctionDetail } from "@0625chopin/shared/types";

interface AuctionInfoProps {
  /** 경매 상세 데이터 */
  detail: AuctionDetail;
}

export function AuctionInfo({ detail }: AuctionInfoProps) {
  // 중고등급 표시 라벨 (DB 공통코드에서 조회해 detail에 주입됨)
  const conditionLabel = detail.conditionLabel;

  // 종료 상태 여부 판별 (낙찰/유찰/강제종료)
  const isWon = detail.status === "won";
  const isForceClosed = detail.status === "force_closed";
  const isFailed = detail.status === "failed";
  const isEnded = isWon || isFailed || isForceClosed;

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
              {isWon ? "낙찰 완료" : isForceClosed ? "강제종료" : "유찰 종료"}
            </span>
          )}
        </div>

        {/* 상품 제목 */}
        <h1 className="text-foreground text-xl leading-snug font-bold">
          {detail.title}
        </h1>
      </div>

      {/* ===== 메타 정보: 카테고리·중고등급·지역 ===== */}
      <div
        className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
        aria-label="상품 정보"
      >
        {/* 카테고리 */}
        <span className="flex items-center gap-1">
          <Tag className="size-3 shrink-0" aria-hidden="true" />
          {detail.categoryLabel}
        </span>

        <span aria-hidden="true" className="text-border select-none">
          ·
        </span>

        {/* 중고등급 */}
        <span>{conditionLabel}</span>

        <span aria-hidden="true" className="text-border select-none">
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
          <p className="text-muted-foreground text-xs">현재가</p>
          <p
            className="text-foreground text-2xl font-bold"
            aria-label={`현재가 ${formatPrice(detail.currentPrice)}`}
          >
            {formatPrice(detail.currentPrice)}
          </p>
        </div>

        {/* 즉시구매가 (있을 때만 표시) */}
        {detail.buyNowPrice !== null && (
          <div className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2">
            <p className="text-muted-foreground text-sm">즉시구매가</p>
            <p
              className="text-foreground text-sm font-semibold"
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
            <p className="text-muted-foreground text-xs">상품 설명</p>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
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
          <span className="text-muted-foreground text-xs">마감</span>
          <RemainingTime endsAt={detail.auctionEndsAt} />
        </div>

        {/* 입찰 수 */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Gavel className="size-3 shrink-0" aria-hidden="true" />
            입찰
          </span>
          <span
            className="text-foreground text-sm font-medium"
            aria-label={`${detail.bidCount}회 입찰`}
          >
            {detail.bidCount}회
          </span>
        </div>

        {/* 시작가 */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">시작가</span>
          <span className="text-muted-foreground text-sm">
            {formatPrice(detail.startPrice)}
          </span>
        </div>
      </div>
    </article>
  );
}
