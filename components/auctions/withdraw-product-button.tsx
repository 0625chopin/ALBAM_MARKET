"use client";

// 상품 내리기 버튼 (판매자 전용, T056)
// 경매 상세에서 본인 active 상품일 때 노출한다. withdraw_product RPC를 호출한다.
// ISSUE-006: 입찰이 있어도 내릴 수 있으나 패널티가 부과된다(누적 시 경매 등록 제한 — ISSUE-004).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { withdrawProduct } from "@/lib/mutations/auctions";

interface WithdrawProductButtonProps {
  /** 대상 상품 ID */
  productId: string;
}

export function WithdrawProductButton({
  productId,
}: WithdrawProductButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleWithdraw = async () => {
    setError(null);
    try {
      await withdrawProduct(productId);
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 내리기에 실패했습니다.");
    }
  };

  if (done) {
    return (
      <p
        className="text-foreground text-center text-sm font-medium"
        role="status"
        aria-live="polite"
      >
        상품을 내렸습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ConfirmDialog
        trigger={
          <Button variant="outline" className="w-full">
            상품 내리기
          </Button>
        }
        title="상품을 내리시겠습니까?"
        description="진행 중인 경매를 종료하고 상품을 내립니다. 이미 입찰이 있는 경우 패널티가 부과되며, 패널티가 누적되면 경매 등록이 제한될 수 있습니다."
        confirmLabel="상품 내리기"
        onConfirm={handleWithdraw}
      />
      {error && (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
