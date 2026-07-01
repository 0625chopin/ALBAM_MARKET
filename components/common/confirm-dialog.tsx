"use client";

// 공용 확인 다이얼로그 (T032)
// 파괴적/되돌릴 수 없는 액션(거래완료·낙찰 포기·상품 내리기 등) 실행 전 확인을 받는다.
// ui/dialog 프리미티브를 감싼 얇은 래퍼이며, trigger를 asChild로 받아 임의 버튼에 연결한다.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  /** 다이얼로그를 여는 트리거 요소 (asChild로 전달 — 보통 Button) */
  trigger: React.ReactNode;
  /** 다이얼로그 제목 */
  title: string;
  /** 부가 설명 (선택) */
  description?: string;
  /** 확인 버튼 라벨 (기본: "확인") */
  confirmLabel?: string;
  /** 취소 버튼 라벨 (기본: "취소") */
  cancelLabel?: string;
  /** 확인 버튼 variant (파괴적 액션은 "destructive") */
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  /** 확인 시 실행할 콜백 — 호출 후 다이얼로그는 자동으로 닫힌다 */
  onConfirm: () => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  // 다이얼로그 열림 상태 (제어 컴포넌트)
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
