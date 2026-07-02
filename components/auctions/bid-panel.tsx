"use client";

// 입찰 / 즉시구매 패널 컴포넌트 (T023 마크업 + T031 인터랙션 + T053 실제출)
// T053: handleBid/handleBuyNow 가 원자적 RPC(place_bid/buy_now)를 호출한다.
//       클라이언트 검증은 UX용 사전 검증이며, 서버 RPC가 최신 현재가 기준으로 최종 재검증한다.
// ISSUE-003 확정: 최소 입찰 증가폭은 정액 방식(1,000원)으로 확정.
//            운영값은 codes.policy.min_bid_increment(서버 place_bid 최종 검증), 이 컴포넌트는 UX 사전검증.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { placeBid, buyNow } from "@/lib/mutations/auctions";
import { cn } from "@/lib/utils";

// ===== Props 타입 =====
interface BidPanelProps {
  /** 대상 상품 ID (RPC 호출용). 쇼케이스 등 미연동 컨텍스트에서는 생략 가능. */
  productId?: string;
  /** 현재 최고 입찰가 (원) */
  currentPrice: number;
  /** 즉시구매가 (없으면 null) */
  buyNowPrice: number | null;
  /** 본인 상품 여부 (기본값: false) */
  isOwner?: boolean;
  /** 로그인 여부 (기본값: true) */
  isLoggedIn?: boolean;
  /** 최소 입찰 증가폭(원) — DB 공통코드(codes.policy.min_bid_increment) 주입 */
  minBidIncrement: number;
  /** 추가 클래스 */
  className?: string;
}

// ===== BidPanel 컴포넌트 =====
export function BidPanel({
  productId,
  currentPrice,
  buyNowPrice,
  isOwner = false,
  isLoggedIn = true,
  minBidIncrement,
  className,
}: BidPanelProps) {
  const router = useRouter();
  // 입찰가 입력 상태 — 진입 시 최소 입찰가(현재가 + 증가폭)로 미리 채워
  // 사용자가 바로 "입찰하기"를 눌러도 빈값 검증에 걸리지 않도록 한다.
  const [bidAmount, setBidAmount] = useState(() =>
    String(currentPrice + minBidIncrement)
  );
  // 현재가 — 입찰 성공 시 서버 확정가(place_bid 반환)로 즉시 갱신
  const [currentPriceState, setCurrentPriceState] = useState(currentPrice);
  // 이 세션에서 내가 입찰한 횟수 (성공 시 +1, 표시용)
  const [bidCount, setBidCount] = useState(0);
  // 입찰가 검증 에러 메시지 (없으면 null)
  const [bidError, setBidError] = useState<string | null>(null);
  // 입찰 성공 메시지 표시 여부
  const [bidSuccess, setBidSuccess] = useState(false);
  // 즉시구매 확인 다이얼로그 열림 상태
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  // 즉시구매(낙찰 확정) 완료 여부 — 완료 시 패널을 확정 안내로 전환
  const [boughtNow, setBoughtNow] = useState(false);
  // RPC 제출 진행 상태 (버튼 비활성·중복 제출 방지)
  const [isBidding, setIsBidding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // 최소 입찰 가능 금액 = 현재가 + 최소 증가폭(DB 정책값)
  const minBidPrice = currentPriceState + minBidIncrement;

  // 천 단위 콤마 포맷 (원 단위 숫자 문자열 → "35,000", 빈 값은 그대로)
  const formatComma = (digits: string) =>
    digits === "" ? "" : Number(digits).toLocaleString("ko-KR");

  // 입력 변경 — 숫자(0~9)만 남겨 raw로 저장 (표시는 콤마 포맷)
  const handleBidChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setBidAmount(digits);
    if (bidError) setBidError(null);
    if (bidSuccess) setBidSuccess(false);
  };

  // 1,000원 단위 증감 — 비어 있으면 최소 입찰가에서 시작, 최소가 미만으로는 내려가지 않음
  const stepBid = (delta: number) => {
    const base = bidAmount === "" ? minBidPrice - delta : Number(bidAmount);
    const next = Math.max(minBidPrice, base + delta);
    setBidAmount(String(next));
    if (bidError) setBidError(null);
    if (bidSuccess) setBidSuccess(false);
  };

  // 감소 버튼 비활성 조건 — 이미 최소 입찰가 이하인 경우
  const decreaseDisabled = bidAmount !== "" && Number(bidAmount) <= minBidPrice;

  // 입찰 처리 — 클라이언트 사전 검증 후 원자적 RPC place_bid 호출 (서버가 최종 재검증)
  const handleBid = async () => {
    setBidSuccess(false);
    const trimmed = bidAmount.trim();

    // 1) 빈값 검증
    if (trimmed === "") {
      setBidError("입찰가를 입력해 주세요.");
      return;
    }

    // 2) 숫자 검증
    const amount = Number(trimmed);
    if (!Number.isFinite(amount)) {
      setBidError("숫자만 입력할 수 있습니다.");
      return;
    }

    // 3) 최소 입찰가 검증 (현재가 + 증가폭)
    if (amount < minBidPrice) {
      setBidError(`최소 ${formatPrice(minBidPrice)} 이상 입찰할 수 있습니다.`);
      return;
    }

    // 4) 증가폭 단위 검증 (현재가 기준, DB 정책값)
    if ((amount - currentPriceState) % minBidIncrement !== 0) {
      setBidError(
        `입찰가는 ${formatPrice(minBidIncrement)} 단위로 입력해 주세요.`
      );
      return;
    }

    // productId 미연동 컨텍스트(쇼케이스 등)에서는 제출하지 않음
    if (!productId) {
      setBidError("입찰을 처리할 수 없습니다.");
      return;
    }

    setBidError(null);
    setIsBidding(true);
    try {
      const newPrice = await placeBid(productId, amount);
      // 서버 확정 현재가로 갱신 + 다음 최소 입찰가로 입력칸 재설정
      setCurrentPriceState(newPrice);
      setBidCount((prev) => prev + 1);
      setBidAmount(String(newPrice + minBidIncrement));
      setBidSuccess(true);
      router.refresh();
    } catch (error) {
      setBidError(
        error instanceof Error ? error.message : "입찰에 실패했습니다."
      );
    } finally {
      setIsBidding(false);
    }
  };

  // 즉시구매 확정 — 원자적 RPC buy_now 호출 (경매 종료 + 거래/채팅 생성)
  const handleBuyNow = async () => {
    if (!productId) {
      setBuyNowOpen(false);
      return;
    }
    setIsBuying(true);
    try {
      await buyNow(productId);
      setBuyNowOpen(false);
      setBoughtNow(true);
      router.refresh();
    } catch (error) {
      setBidError(
        error instanceof Error ? error.message : "즉시구매에 실패했습니다."
      );
      setBuyNowOpen(false);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      {/* ===== 공통 상단: 현재가 표시 ===== */}
      <CardHeader className="pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            현재가
          </span>
          <span className="text-foreground text-2xl font-bold">
            {formatPrice(currentPriceState)}
          </span>
        </div>
        {/* 낙관적 입찰 횟수 표시 (입찰이 1회 이상 발생했을 때만) */}
        {bidCount > 0 && (
          <p className="text-muted-foreground text-right text-xs">
            내 입찰 {bidCount}회 반영됨
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ===== 즉시구매 완료(낙찰 확정) 상태 ===== */}
        {boughtNow ? (
          <div
            className="bg-muted/60 rounded-lg border px-4 py-5 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-foreground text-sm font-semibold">
              즉시구매로 낙찰이 확정되었습니다.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              거래 내역에서 판매자와 채팅으로 약속을 잡아보세요.
            </p>
            {/* 생성된 거래로 이동 (거래 목록에서 해당 거래의 채팅방 진입) */}
            <Button asChild className="mt-4 w-full">
              <Link href="/transactions">거래 내역으로 이동</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* ===== 비로그인 상태: 로그인 유도 ===== */}
            {!isLoggedIn && (
              <div
                className="bg-muted/60 rounded-lg px-4 py-5 text-center"
                role="alert"
                aria-live="polite"
              >
                <p className="text-muted-foreground mb-3 text-sm">
                  입찰하려면 로그인이 필요합니다.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">로그인하기</Link>
                </Button>
              </div>
            )}

            {/* ===== 본인 상품 상태: 입력 영역 비활성 + 안내 ===== */}
            {isLoggedIn && isOwner && (
              <>
                <div
                  className="bg-muted/60 rounded-lg px-4 py-3 text-center"
                  role="note"
                  aria-label="본인 상품 입찰 불가 안내"
                >
                  <p className="text-muted-foreground text-sm">
                    본인 상품에는 입찰할 수 없습니다.
                  </p>
                </div>

                {/* 비활성 입찰 영역 — 시각적 참고용 */}
                <div className="space-y-2 opacity-40" aria-hidden="true">
                  <Label
                    htmlFor="bid-amount-owner"
                    className="text-sm font-medium"
                  >
                    입찰가
                  </Label>
                  <Input
                    id="bid-amount-owner"
                    type="number"
                    placeholder={String(minBidPrice)}
                    disabled
                    aria-disabled="true"
                  />
                  <Button className="w-full" disabled aria-disabled="true">
                    입찰하기
                  </Button>
                </div>
              </>
            )}

            {/* ===== 일반 상태: 로그인 + 타인 상품 ===== */}
            {isLoggedIn && !isOwner && (
              <>
                {/* 입찰가 입력 영역 — 1,000원 단위 증감 + 천 단위 콤마 표시 */}
                <div className="space-y-2">
                  <Label htmlFor="bid-amount" className="text-sm font-medium">
                    입찰가
                  </Label>
                  <div className="flex items-stretch gap-2">
                    {/* 1,000원 감소 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => stepBid(-minBidIncrement)}
                      disabled={decreaseDisabled}
                      aria-label="입찰가 1,000원 감소"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </Button>

                    {/* 금액 입력 — 콤마 포맷 표시, 숫자만 입력 */}
                    <Input
                      id="bid-amount"
                      type="text"
                      inputMode="numeric"
                      className="text-right"
                      placeholder={formatComma(String(minBidPrice))}
                      value={formatComma(bidAmount)}
                      onChange={(e) => handleBidChange(e.target.value)}
                      aria-invalid={bidError !== null}
                      aria-describedby="bid-hint"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleBid();
                        }
                      }}
                    />

                    {/* 1,000원 증가 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => stepBid(minBidIncrement)}
                      aria-label="입찰가 1,000원 증가"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {/* 검증 힌트 — 증가폭은 DB 정책값(codes.policy.min_bid_increment) */}
                  <p id="bid-hint" className="text-muted-foreground text-xs">
                    최소{" "}
                    <span className="text-foreground font-semibold">
                      {formatPrice(minBidPrice)}
                    </span>{" "}
                    이상 · {formatPrice(minBidIncrement)} 단위로 입찰
                  </p>

                  {/* 입찰 검증 에러 메시지 */}
                  {bidError && (
                    <p
                      className="text-destructive text-xs font-medium"
                      role="alert"
                      aria-live="assertive"
                    >
                      {bidError}
                    </p>
                  )}

                  {/* 입찰 성공 메시지 (낙관적 UI) */}
                  {bidSuccess && (
                    <p
                      className="text-foreground text-xs font-medium"
                      role="status"
                      aria-live="polite"
                    >
                      입찰되었습니다. 현재 최고가가 갱신되었습니다.
                    </p>
                  )}
                </div>

                {/* 입찰하기 버튼 */}
                <Button
                  className="w-full"
                  onClick={handleBid}
                  disabled={isBidding}
                  aria-busy={isBidding}
                  aria-label={`${formatPrice(minBidPrice)} 이상으로 입찰하기`}
                >
                  {isBidding ? "입찰 중..." : "입찰하기"}
                </Button>

                {/* 즉시구매 영역 — buyNowPrice가 있을 때만 표시 */}
                {buyNowPrice !== null && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      {/* 즉시구매가 표시 */}
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                          즉시구매가
                        </span>
                        <span className="text-foreground text-lg font-semibold">
                          {formatPrice(buyNowPrice)}
                        </span>
                      </div>

                      {/* 즉시구매 버튼 — 클릭 시 확인 다이얼로그 오픈 */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setBuyNowOpen(true)}
                        aria-label={`${formatPrice(buyNowPrice)}에 즉시구매`}
                      >
                        즉시구매
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </CardContent>

      {/* ===== 즉시구매 확인 다이얼로그 ===== */}
      {/* T032에서 공용 ConfirmDialog로 추출 가능하나, 본 패널은 즉시구매 전용 안내가 있어 인라인 유지 */}
      {buyNowPrice !== null && (
        <Dialog open={buyNowOpen} onOpenChange={setBuyNowOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>즉시구매 확인</DialogTitle>
              <DialogDescription>
                {formatPrice(buyNowPrice)}에 즉시구매하면 경매가 즉시 종료되고
                낙찰이 확정됩니다. 진행하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setBuyNowOpen(false)}
                disabled={isBuying}
              >
                취소
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={isBuying}
                aria-busy={isBuying}
              >
                {isBuying ? "처리 중..." : "즉시구매 확정"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
