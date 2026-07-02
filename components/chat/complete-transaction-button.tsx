"use client";

// 채팅방 거래완료 버튼 (구매자 전용, T058)
// complete_transaction RPC 를 호출해 거래를 completed 로 확정한다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeTransaction } from "@/lib/mutations/transactions";

interface CompleteTransactionButtonProps {
  /** 대상 거래 id */
  transactionId: string;
}

export function CompleteTransactionButton({
  transactionId,
}: CompleteTransactionButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await completeTransaction(transactionId);
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "거래완료에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t px-4 py-2">
      {done ? (
        <p
          className="text-foreground py-1 text-center text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          거래가 완료되었습니다.
        </p>
      ) : (
        <>
          <Button
            variant="secondary"
            className="w-full"
            size="sm"
            onClick={handleComplete}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "거래 완료"}
          </Button>
          {error && (
            <p
              className="text-destructive mt-1 text-center text-xs font-medium"
              role="alert"
            >
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
