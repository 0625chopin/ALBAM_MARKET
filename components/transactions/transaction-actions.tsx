"use client";

// 거래 카드 액션 영역 (Client Component)
// transaction-card(RSC)에서 액션 버튼부만 분리해 클라이언트 인터랙션을 담당한다.
// 거래완료 / 경매취소(낙찰 포기)를 ConfirmDialog로 확인 후 Supabase mutation(RPC)을 호출한다.
// (상품 내리기는 경매 상세의 별도 컴포넌트 withdraw-product-button 에서 처리한다.)
//
// 확정 정책(docs/ISSUES.md 참조):
// - ISSUE-004: 낙찰 포기자 패널티 — penalties 기록 + 누적 시 경매 등록 제한(30일 3회, 서버 트리거 강제).
// - ISSUE-007: 차순위 수락 대기시간 — 미적용 확정(즉시 이양). 차순위 입찰자에게 그의 입찰가로 즉시 이양.

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
  /** 거래 상태 라벨 맵 value→label (DB 공통코드 codes.transaction_status 주입) */
  statusLabels: Record<TransactionStatus, string>;
}

export function TransactionActions({
  transaction,
  role,
  counterpartNickname,
  chatRoomId,
  statusLabels,
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
          <span className="text-muted-foreground text-xs">변경된 상태</span>
          <StatusBadge
            kind="transaction"
            status={status}
            label={statusLabels[status]}
          />
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
            description="낙찰을 포기하면 차순위 입찰자에게 낙찰 기회가 즉시 넘어갑니다. 포기 패널티가 기록되며, 패널티가 누적되면 경매 등록이 제한될 수 있습니다."
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
          className="text-muted-foreground text-xs"
          role="status"
          aria-live="polite"
        >
          거래가 완료되었습니다. 상대방에게 평점을 남겨보세요.
        </p>
      )}

      {/* 낙찰 포기 결과 + 차순위 연쇄 이양 안내 (ISSUE-004/007) */}
      {lastAction === "abandoned" && (
        <div
          className="bg-muted/40 text-muted-foreground rounded-md border px-3 py-2.5 text-xs"
          role="status"
          aria-live="polite"
        >
          <p className="text-foreground font-medium">낙찰을 포기했습니다.</p>
          <p className="mt-1">
            차순위 입찰자에게 그의 입찰가로 낙찰 기회가 즉시
            이양되었습니다(차순위가 없으면 유찰). 포기 패널티가 기록되며,
            패널티가 누적되면 경매 등록이 제한될 수 있습니다.
          </p>
        </div>
      )}

      {/* 액션 처리 실패 안내 */}
      {actionError && (
        <p className="text-destructive text-xs font-medium" role="alert">
          {actionError}
        </p>
      )}
    </div>
  );
}
