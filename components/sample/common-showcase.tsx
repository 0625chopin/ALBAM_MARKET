// 공통 표현 컴포넌트 쇼케이스 (RSC)
// /sample 페이지에서 공통 컴포넌트 5종을 한 섹션으로 전시한다.
// ImagePlaceholder / StatusBadge / StarRating / LevelBadge / RemainingTime

import { ImagePlaceholder } from "@/components/common/image-placeholder";
import { StatusBadge } from "@/components/common/status-badge";
import { StarRating } from "@/components/common/star-rating";
import { LevelBadge } from "@/components/common/level-badge";
import { RemainingTime } from "@/components/common/remaining-time";
import {
  MOCK_PRODUCT_STATUS_LABELS,
  MOCK_TRANSACTION_STATUS_LABELS,
} from "@/lib/mocks";

export default function CommonShowcase() {
  return (
    <section id="common" className="mb-16 scroll-mt-20">
      {/* 섹션 제목 */}
      <h2 className="text-foreground mb-6 text-2xl font-bold">공통 컴포넌트</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        도메인 전반에서 재사용되는 표현 컴포넌트입니다. 이미지 자리 표시, 상태
        배지, 별점, 레벨 배지, 남은 시간 표시를 포함합니다.
      </p>

      <div className="space-y-8">
        {/* ===== ImagePlaceholder ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            ImagePlaceholder — 이미지 자리 표시
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            {/* 정사각형 소형 */}
            <div className="space-y-2">
              <ImagePlaceholder
                className="aspect-square w-16 rounded-md"
                label="소형 이미지 없음"
              />
              <p className="text-muted-foreground text-center font-mono text-xs">
                w-16
              </p>
            </div>

            {/* 정사각형 중형 */}
            <div className="space-y-2">
              <ImagePlaceholder
                className="aspect-square w-24 rounded-md"
                label="중형 이미지 없음"
              />
              <p className="text-muted-foreground text-center font-mono text-xs">
                w-24
              </p>
            </div>

            {/* 정사각형 대형 */}
            <div className="space-y-2">
              <ImagePlaceholder
                className="aspect-square w-32 rounded-md"
                label="대형 이미지 없음"
              />
              <p className="text-muted-foreground text-center font-mono text-xs">
                w-32
              </p>
            </div>

            {/* 가로형 (상품 카드 썸네일 비율) */}
            <div className="space-y-2">
              <ImagePlaceholder
                className="aspect-video w-40 rounded-md"
                label="가로형 이미지 없음"
              />
              <p className="text-muted-foreground text-center font-mono text-xs">
                w-40 / aspect-video
              </p>
            </div>

            {/* 아바타형 (원형) */}
            <div className="space-y-2">
              <ImagePlaceholder
                className="size-12 rounded-full"
                label="아바타 없음"
              />
              <p className="text-muted-foreground text-center font-mono text-xs">
                avatar
              </p>
            </div>
          </div>
        </div>

        {/* ===== StatusBadge ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            StatusBadge — 상태 배지
          </h3>

          {/* 경매 상품 상태 (ProductStatus 5종) */}
          <div className="mb-4 space-y-2">
            <p className="text-muted-foreground text-xs font-medium">
              경매 상품 상태 (kind=&quot;product&quot;)
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                kind="product"
                status="active"
                label={MOCK_PRODUCT_STATUS_LABELS.active}
              />
              <StatusBadge
                kind="product"
                status="won"
                label={MOCK_PRODUCT_STATUS_LABELS.won}
              />
              <StatusBadge
                kind="product"
                status="failed"
                label={MOCK_PRODUCT_STATUS_LABELS.failed}
              />
              <StatusBadge
                kind="product"
                status="withdrawn"
                label={MOCK_PRODUCT_STATUS_LABELS.withdrawn}
              />
              <StatusBadge
                kind="product"
                status="completed"
                label={MOCK_PRODUCT_STATUS_LABELS.completed}
              />
            </div>
          </div>

          {/* 거래 상태 (TransactionStatus 4종) */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">
              거래 상태 (kind=&quot;transaction&quot;)
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                kind="transaction"
                status="pending"
                label={MOCK_TRANSACTION_STATUS_LABELS.pending}
              />
              <StatusBadge
                kind="transaction"
                status="completed"
                label={MOCK_TRANSACTION_STATUS_LABELS.completed}
              />
              <StatusBadge
                kind="transaction"
                status="auto_completed"
                label={MOCK_TRANSACTION_STATUS_LABELS.auto_completed}
              />
              <StatusBadge
                kind="transaction"
                status="canceled"
                label={MOCK_TRANSACTION_STATUS_LABELS.canceled}
              />
            </div>
          </div>
        </div>

        {/* ===== StarRating ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            StarRating — 별점 표시 (읽기 전용)
          </h3>
          <div className="space-y-3">
            {/* 다양한 점수 전시 */}
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-20 text-xs">최고점</span>
              <StarRating score={9.8} max={10} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-20 text-xs">
                높은 점수
              </span>
              <StarRating score={9.1} max={10} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-20 text-xs">보통</span>
              <StarRating score={7.4} max={10} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-20 text-xs">
                낮은 점수
              </span>
              <StarRating score={4.2} max={10} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-20 text-xs">
                값 숨김
              </span>
              <StarRating score={8.5} max={10} showValue={false} />
            </div>
          </div>
        </div>

        {/* ===== LevelBadge ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            LevelBadge — 레벨 배지
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* 역할 없음 */}
            <LevelBadge level={1} />
            <LevelBadge level={5} />
            <LevelBadge level={10} />

            {/* 판매자 레벨 */}
            <LevelBadge level={3} role="seller" />
            <LevelBadge level={7} role="seller" />

            {/* 구매자 레벨 */}
            <LevelBadge level={2} role="buyer" />
            <LevelBadge level={9} role="buyer" />
          </div>
        </div>

        {/* ===== RemainingTime ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            RemainingTime — 남은 시간
          </h3>
          <p className="text-muted-foreground mb-3 text-xs">
            클라이언트에서 마운트 후 현재 시각과 비교해 계산합니다. 라이브
            카운트다운은 Phase 3 예정.
          </p>
          <div className="space-y-3">
            {/* 미래 시각 — 남은 시간 표시 */}
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-24 text-xs">
                D-2 이상
              </span>
              <RemainingTime endsAt="2026-07-10T21:00:00+09:00" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-24 text-xs">
                내일 마감
              </span>
              <RemainingTime endsAt="2026-06-30T21:00:00+09:00" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-24 text-xs">2일 후</span>
              <RemainingTime endsAt="2026-07-01T12:30:00+09:00" />
            </div>

            {/* 과거 시각 — "마감" 표시 */}
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-24 text-xs">
                이미 마감
              </span>
              <RemainingTime endsAt="2026-06-01T00:00:00+09:00" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
