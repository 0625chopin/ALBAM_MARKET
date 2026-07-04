"use client";

// 거래 카드 액션 영역 (Client Component)
// transaction-card(RSC)에서 액션 버튼부만 분리해 클라이언트 인터랙션을 담당한다.
// 거래완료 / 경매취소(낙찰 포기)를 ConfirmDialog로 확인 후 Supabase mutation(RPC)을 호출한다.
// (상품 내리기는 경매 상세의 별도 컴포넌트 withdraw-product-button 에서 처리한다.)
//
// 확정 정책(docs/ISSUES.md 참조):
// - ISSUE-004: 낙찰 포기자 패널티 — penalties 기록 + 누적 시 경매 등록 제한(30일 3회, 서버 트리거 강제).
// - ISSUE-007: 차순위 수락 대기시간 — 미적용 확정(즉시 이양). 차순위 입찰자에게 그의 입찰가로 즉시 이양.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@0625chopin/shared/ui/button";
import { StatusBadge } from "@0625chopin/shared/common/status-badge";
import { ConfirmDialog } from "@0625chopin/shared/common/confirm-dialog";
import { RatingModal } from "@/components/transactions/rating-modal";
import { ReportDialog } from "@/components/report/report-dialog";
import {
  abandonAuction,
  completeTransaction,
  endTransaction,
} from "@/lib/mutations/transactions";
import type {
  ProductStatus,
  Transaction,
  TransactionStatus,
} from "@0625chopin/shared/types";

interface TransactionActionsProps {
  /** 거래 데이터 (초기 상태 바인딩용) */
  transaction: Transaction;
  /** 거래 대상 상품 상태 (채팅 가능 여부 판정용 — 유찰/내림 차단) */
  productStatus: ProductStatus;
  /** 거래 대상 상품 제목 (상품 신고 모달 제목용) */
  productTitle: string;
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
  productStatus,
  productTitle,
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
  // 구매자의 "거래종료" 처리 여부 — 서버 상태(transactions.ended_at) 기반. 액션 시 낙관적 갱신.
  const [ended, setEnded] = useState(transaction.endedAt != null);

  // 외부 변경(관리자 조치 등 Realtime → router.refresh) 시 서버 prop 으로 로컬 상태 재동기화.
  // 내 액션은 위 핸들러가 낙관적으로 먼저 갱신하고, 외부 변경은 이 effect 가 반영한다(버튼 상태 어긋남 방지).
  useEffect(() => {
    setStatus(transaction.status);
    setEnded(transaction.endedAt != null);
  }, [transaction.status, transaction.endedAt]);

  // 거래 종료 처리 — 완료된 거래를 구매자가 최종 종료(RPC end_transaction, DB ended_at 기록)
  const handleEnd = async () => {
    setActionError(null);
    try {
      await endTransaction(transaction.id);
      setEnded(true);
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "거래 종료에 실패했습니다."
      );
    }
  };

  // 거래 완료(completed, auto_completed) 여부
  const isCompleted = status === "completed" || status === "auto_completed";
  // 진행중 여부 — 액션 버튼 노출 조건
  const isPending = status === "pending";
  // 채팅 가능 여부 — 채팅방이 있고, 유찰/내림/취소가 아닐 때만.
  // 취소는 로컬 status로 판정해 '낙찰 포기' 직후 버튼이 즉시 사라지게 한다.
  const canChat =
    !!chatRoomId &&
    status !== "canceled" &&
    productStatus !== "failed" &&
    productStatus !== "withdrawn" &&
    productStatus !== "force_closed";

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
        {/* 채팅하기: 성립·진행 중인 거래에서만 노출 (유찰/내림/취소 차단) */}
        {canChat && (
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

        {/* 상품 신고: 구매자만 (판매자는 본인 상품이라 제외). 거래 상태 무관. */}
        {role === "buyer" && (
          <ReportDialog
            targetType="product"
            targetId={transaction.productId}
            targetLabel={productTitle}
            triggerLabel="상품 신고"
            triggerVariant="outline"
            triggerSize="sm"
          />
        )}

        {/* 거래종료: 구매자 + 거래완료 상태(상품거래 완료) + 아직 미종료 */}
        {role === "buyer" && isCompleted && !ended && (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="secondary">
                거래종료
              </Button>
            }
            title="거래를 종료하시겠습니까?"
            description="완료된 거래를 최종 종료 처리합니다. 종료 후에도 평점은 남길 수 있습니다."
            confirmLabel="거래종료"
            onConfirm={handleEnd}
          />
        )}
      </div>

      {/* 거래종료 결과 안내 */}
      {ended && (
        <p
          className="text-muted-foreground text-xs"
          role="status"
          aria-live="polite"
        >
          거래가 종료되었습니다.
        </p>
      )}

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
