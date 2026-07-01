"use client";

// 거래 카드 액션 영역 (Client Component, T032)
// transaction-card(RSC)에서 액션 버튼부만 분리해 클라이언트 인터랙션을 담당한다.
// 거래완료 / 경매취소(낙찰 포기) / 상품 내리기를 ConfirmDialog로 확인 후
// 로컬 상태(status)를 갱신하는 Mock 시뮬레이션이다.
// Phase 5: onConfirm 내부를 Supabase mutation으로 교체하고, status는 서버 데이터로 대체한다.
//
// 미결정 정책(임시 처리, docs/ISSUES.md 참조):
// - ISSUE-004: 낙찰 포기자 패널티 — 기록만 우선, 제재 강도 미적용.
// - ISSUE-006: 입찰 후 상품 내리기 제한 — 강도 미결정, 보수적으로 확인 다이얼로그만.
// - ISSUE-007: 차순위 수락 대기시간 — 미적용(즉시 이양 가정). 안내 UI만 표시.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RatingModal } from "@/components/transactions/rating-modal";
import {
  abandonAuction,
  completeTransaction,
} from "@/lib/mutations/transactions";
import type { Transaction, TransactionStatus } from "@/lib/types";

interface TransactionActionsProps {
  /** 거래 데이터 (초기 상태 바인딩용) */
  transaction: Transaction;
  /** 현재 사용자의 역할 */
  role: "seller" | "buyer";
  /** 거래 상대방 닉네임 (평점 모달용) */
  counterpartNickname: string;
  /** 연결된 채팅방 id (없으면 null) */
  chatRoomId: string | null;
}

export function TransactionActions({
  transaction,
  role,
  counterpartNickname,
  chatRoomId,
}: TransactionActionsProps) {
  const router = useRouter();
  // 거래 상태 — 액션 시 로컬에서 갱신
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  // 직전 액션 종류 — 결과 안내 문구 분기용
  const [lastAction, setLastAction] = useState<
    "completed" | "abandoned" | null
  >(null);
  // 낙찰 포기 처리 에러
  const [actionError, setActionError] = useState<string | null>(null);

  // 거래 완료(completed, auto_completed) 여부
  const isCompleted = status === "completed" || status === "auto_completed";
  // 진행중 여부 — 액션 버튼 노출 조건
  const isPending = status === "pending";

  // 거래완료 확정 (구매자) — RPC complete_transaction
  const handleComplete = async () => {
    setActionError(null);
    try {
      await completeTransaction(transaction.id);
      setStatus("completed");
      setLastAction("completed");
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "거래완료에 실패했습니다."
      );
    }
  };

  // 경매취소(낙찰 포기) 확정 (구매자) — 원자적 RPC로 차순위 연쇄 이양 + 패널티 기록
  const handleAbandon = async () => {
    setActionError(null);
    try {
      await abandonAuction(transaction.productId);
      setStatus("canceled");
      setLastAction("abandoned");
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "낙찰 포기에 실패했습니다."
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* 액션 결과 상태 배지 — 액션 후 갱신된 상태 노출 */}
      {lastAction && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">변경된 상태</span>
          <StatusBadge kind="transaction" status={status} />
        </div>
      )}

      {/* 액션 버튼 / 결과 안내 영역 */}
      <div className="flex flex-wrap gap-2">
        {/* 채팅하기: 채팅방이 있으면 항상 노출 */}
        {chatRoomId && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/chat/${chatRoomId}`}>채팅하기</Link>
          </Button>
        )}

        {/* 거래완료: 구매자 + 진행중 */}
        {role === "buyer" && isPending && (
          <ConfirmDialog
            trigger={<Button size="sm">거래완료</Button>}
            title="거래완료 확인"
            description="거래가 완료되었음을 확인합니다. 확정 후에는 되돌릴 수 없으며 상호 평점을 남길 수 있습니다."
            confirmLabel="거래완료"
            onConfirm={handleComplete}
          />
        )}

        {/* 경매취소(낙찰 포기): 구매자 + 진행중 */}
        {role === "buyer" && isPending && (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="destructive">
                경매취소(낙찰 포기)
              </Button>
            }
            title="낙찰을 포기하시겠습니까?"
            description="낙찰을 포기하면 차순위 입찰자에게 낙찰 기회가 넘어갑니다. 포기 이력이 기록될 수 있습니다."
            confirmLabel="낙찰 포기"
            confirmVariant="destructive"
            onConfirm={handleAbandon}
          />
        )}

        {/* 평점 남기기: 거래 완료 상태일 때 */}
        {isCompleted && (
          <RatingModal
            transactionId={transaction.id}
            counterpartNickname={counterpartNickname}
          />
        )}
      </div>

      {/* 거래완료 결과 안내 */}
      {lastAction === "completed" && (
        <p
          className="text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          거래가 완료되었습니다. 상대방에게 평점을 남겨보세요.
        </p>
      )}

      {/* 낙찰 포기 결과 + 차순위 연쇄 이양 안내 (ISSUE-004/007) */}
      {lastAction === "abandoned" && (
        <div
          className="rounded-md border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <p className="font-medium text-foreground">낙찰을 포기했습니다.</p>
          <p className="mt-1">
            차순위 입찰자에게 그의 입찰가로 낙찰 기회가 이양되었습니다(차순위가
            없으면 유찰). 포기 이력이 기록되었습니다.
          </p>
        </div>
      )}

      {/* 액션 처리 실패 안내 */}
      {actionError && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {actionError}
        </p>
      )}
    </div>
  );
}
