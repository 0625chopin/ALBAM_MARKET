// 경매 카드 컴포넌트 (RSC)
// 홈 목록 및 검색 결과 등에서 경매 상품 1건을 카드 형태로 표시한다.
// 430px 모바일 프레임 2열 그리드에 맞게 컴팩트하게 설계.
// 카드 전체가 Link로 감싸져 클릭 시 /auctions/[id] 상세 페이지로 이동한다.

import Link from "next/link";
import { MapPin } from "lucide-react";
import { ImagePlaceholder } from "@0625chopin/shared/common/image-placeholder";
import { ProductImage } from "@0625chopin/shared/common/product-image";
import { StatusBadge } from "@0625chopin/shared/common/status-badge";
import { RemainingTime } from "@0625chopin/shared/common/remaining-time";
import { formatPrice } from "@0625chopin/shared/format";
import { cn } from "@0625chopin/shared/utils";
import type { AuctionSummary } from "@0625chopin/shared/types";

interface AuctionCardProps {
  /** 경매 카드에 표시할 요약 데이터 */
  auction: AuctionSummary;
  /** 추가 Tailwind 클래스 (선택) */
  className?: string;
  /** 대표 이미지 우선 로드 여부 (첫 화면 above-the-fold LCP 최적화용) */
  priority?: boolean;
}

export function AuctionCard({
  auction,
  className,
  priority,
}: AuctionCardProps) {
  return (
    // 카드 전체를 Link로 감싸 경매 상세 페이지로 이동
    <Link
      href={`/auctions/${auction.id}`}
      className={cn(
        // 기본 카드 스타일 — 시맨틱 색상 변수만 사용
        "group bg-card flex flex-col overflow-hidden rounded-lg border",
        // hover 시 약한 섀도우 및 테두리 강조
        "hover:border-foreground/20 transition-all hover:shadow-sm",
        className
      )}
      aria-label={`${auction.title} — 현재가 ${formatPrice(auction.currentPrice)}`}
    >
      {/* ===== 이미지 영역 ===== */}
      <div className="relative">
        {/* 대표 이미지: 있으면 ProductImage(로드 실패 시 자동 폴백), 없으면 placeholder */}
        {auction.primaryImageUrl ? (
          <ProductImage
            src={auction.primaryImageUrl}
            alt={auction.title}
            width={300}
            height={300}
            priority={priority}
            className="aspect-square w-full object-cover"
            sizes="(max-width: 430px) 50vw, 215px"
            placeholderClassName="aspect-square w-full"
          />
        ) : (
          <ImagePlaceholder
            className="aspect-square w-full"
            label={auction.title}
          />
        )}

        {/* 상태 배지 — 이미지 우상단에 절대 배치 */}
        <div className="absolute top-1.5 right-1.5">
          <StatusBadge
            kind="product"
            status={auction.status}
            label={auction.statusLabel}
          />
        </div>
      </div>

      {/* ===== 카드 본문: 제목·가격·메타 ===== */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {/* 제목: 2줄까지 표시 후 말줄임 */}
        <p className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
          {auction.title}
        </p>

        {/* 현재 최고가 + 시작가(보조) + 즉시구매가(있을 때만) */}
        <div className="space-y-0.5">
          <p className="text-foreground text-sm font-bold">
            {formatPrice(auction.currentPrice)}
          </p>
          <p className="text-muted-foreground text-xs">
            시작가 {formatPrice(auction.startPrice)}
          </p>
          {auction.buyNowPrice !== null && (
            // 색상: 상단 상태 필터에서 선택된 탭의 텍스트 색과 동일(text-primary-foreground)
            <p className="text-primary-foreground text-xs font-medium">
              즉시구매 {formatPrice(auction.buyNowPrice)}
            </p>
          )}
        </div>

        {/* 하단 메타: 지역 + 남은 시간 */}
        <div className="mt-auto flex items-center justify-between gap-1 pt-1">
          {/* 직거래 지역 */}
          <span
            className="text-muted-foreground flex items-center gap-0.5 text-xs"
            aria-label={`거래 지역: ${auction.region}`}
          >
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            {auction.region}
          </span>

          {/* 남은 시간 (Client Component — hydration 안전) */}
          <RemainingTime endsAt={auction.auctionEndsAt} />
        </div>
      </div>
    </Link>
  );
}
