"use client";

// 신고 다이얼로그 (Client Component, FA050)
// 트리거 버튼 + 사유 선택(Select) + 상세 설명(textarea) 모달을 제공한다.
// RatingModal 패턴을 따른다: 제어형 Dialog, 닫을 때 상태 초기화, 제출 후 완료 화면.
// 대상(targetType/targetId)은 상위 페이지가 보유한 값을 props 로 주입한다.

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@0625chopin/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@0625chopin/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@0625chopin/shared/ui/select";
import type { ReportTargetType, SelectOption } from "@0625chopin/shared/types";
import { submitReport } from "@/lib/mutations/reports";
import { fetchReportReasonOptions } from "@/lib/queries/codes-client";

interface ReportDialogProps {
  /** 신고 대상 유형 */
  targetType: ReportTargetType;
  /** 신고 대상 식별자 */
  targetId: string;
  /** 대상 표시 이름 (모달 제목에 노출, 예: 상품명·닉네임) */
  targetLabel?: string;
  /** 트리거 버튼 라벨 (기본: "신고") */
  triggerLabel?: string;
  /** 트리거 버튼 variant (기본: "outline") */
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  /** 트리거 버튼 size (기본: "sm") */
  triggerSize?: ComponentProps<typeof Button>["size"];
  /** 트리거 버튼 추가 className */
  triggerClassName?: string;
}

export function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  triggerLabel = "신고",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 신고 사유 옵션 — 공통코드(codes.report_reason) 를 브라우저에서 조회(모듈 캐시 재사용)
  const [reasonOptions, setReasonOptions] = useState<SelectOption[]>([]);

  // 다이얼로그를 처음 열 때 사유 옵션을 조회한다(닫힌 동안엔 조회하지 않음).
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchReportReasonOptions().then((opts) => {
      if (active) setReasonOptions(opts);
    });
    return () => {
      active = false;
    };
  }, [open]);

  const resetState = () => {
    setReason("");
    setDetail("");
    setSubmitted(false);
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetState();
  };

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitReport({ targetType, targetId, reason, detail });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "신고 접수에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = targetLabel ? `${targetLabel} 신고하기` : "신고하기";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
        >
          <Flag className="size-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          // ===== 제출 완료 화면 =====
          <div className="py-6 text-center" role="status" aria-live="polite">
            <p className="text-foreground text-sm font-semibold">
              신고가 접수되었습니다.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              운영팀이 확인 후 조치합니다. 신고해 주셔서 감사합니다.
            </p>
            <Button
              type="button"
              className="mt-5"
              onClick={() => handleOpenChange(false)}
            >
              닫기
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {/* 사유 선택 */}
              <div className="space-y-2">
                <label
                  htmlFor="report-reason"
                  className="text-foreground text-sm font-medium"
                >
                  신고 사유
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="report-reason" className="w-full">
                    <SelectValue
                      placeholder={
                        reasonOptions.length === 0
                          ? "사유 불러오는 중…"
                          : "사유를 선택하세요"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 상세 설명 (선택) */}
              <div className="space-y-2">
                <label
                  htmlFor="report-detail"
                  className="text-foreground text-sm font-medium"
                >
                  상세 설명{" "}
                  <span className="text-muted-foreground font-normal">
                    (선택)
                  </span>
                </label>
                <textarea
                  id="report-detail"
                  rows={3}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="신고 사유를 구체적으로 작성해 주세요."
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {submitError && (
              <p
                className="text-destructive text-center text-xs font-medium"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="button"
                disabled={!reason || isSubmitting}
                aria-busy={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "접수 중..." : "신고 접수"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
