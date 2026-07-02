"use client";

// 평점 남기기 모달 컴포넌트 (Client Component, T025 마크업 + T032 인터랙션 + T059 실저장)
// Dialog로 별점(1~10, 반 별 단위) + 코멘트 입력 UI를 제공한다.
// T059: handleSubmit 을 submit_rating RPC 호출로 교체(거래당 1회·완료 거래만, 평가 후 레벨 재계산).
// ISSUE-016: 코멘트는 ratings.comment 컬럼 + submit_rating p_comment 인자로 저장된다(선택값).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitRating } from "@/lib/mutations/transactions";

interface RatingModalProps {
  /** 평가 대상 거래 id */
  transactionId: string;
  /** 평점을 남길 상대방 닉네임 */
  counterpartNickname: string;
  /** 트리거 버튼 라벨 (기본: "평점 남기기") */
  triggerLabel?: string;
}

export function RatingModal({
  transactionId,
  counterpartNickname,
  triggerLabel = "평점 남기기",
}: RatingModalProps) {
  const router = useRouter();
  // 다이얼로그 열림 상태 (제어 — 닫을 때 입력 초기화)
  const [open, setOpen] = useState(false);
  // 현재 선택된 별점 (1~10, 미선택 시 0)
  const [selectedScore, setSelectedScore] = useState<number>(0);
  // 마우스 호버 중인 별점 (시각적 피드백용)
  const [hoveredScore, setHoveredScore] = useState<number>(0);
  // 코멘트 입력값
  const [comment, setComment] = useState("");
  // 제출 완료 여부 (완료 메시지 표시용)
  const [submitted, setSubmitted] = useState(false);
  // 제출 진행/에러 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 실제 표시에 사용하는 점수: 호버 중이면 호버값, 아니면 선택값
  const displayScore = hoveredScore > 0 ? hoveredScore : selectedScore;

  // 입력 상태 초기화
  const resetState = () => {
    setSelectedScore(0);
    setHoveredScore(0);
    setComment("");
    setSubmitted(false);
    setSubmitError(null);
  };

  // 다이얼로그 열림/닫힘 처리 — 닫을 때 상태 초기화
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetState();
  };

  // 평점 제출 — 별점>0 검증 후 submit_rating RPC (거래당 1회, 평가 후 레벨 재계산)
  const handleSubmit = async () => {
    if (selectedScore === 0) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitRating(transactionId, selectedScore, comment.trim() || null);
      setSubmitted(true);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "평점 제출에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* 모달 열기 트리거 버튼 */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          {/* 모달 제목: 상대방 닉네임 포함 */}
          <DialogTitle>{counterpartNickname}님에게 평점 남기기</DialogTitle>
        </DialogHeader>

        {submitted ? (
          // ===== 제출 완료 화면 =====
          <div className="py-6 text-center" role="status" aria-live="polite">
            <p className="text-sm font-semibold text-foreground">
              {selectedScore / 2}개의 별 ({selectedScore}/10점) 평점을
              남겼습니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              소중한 평가 감사합니다.
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
            {/* 별점 입력 영역 */}
            <div className="space-y-4 py-2">
              {/* 별 5개 별점 UI — 별 0.5개(반 별) 단위로 1점씩, 총 1~10점 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">별점</p>
                <div
                  className="flex gap-1"
                  role="group"
                  aria-label="별점 선택 (별 0.5개 단위, 1~10점)"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    // 별 한 개 = 좌측 반(2i+1점) + 우측 반(2i+2점)
                    const leftScore = i * 2 + 1;
                    const rightScore = i * 2 + 2;
                    // 이 별의 채움 비율: 우측 반까지면 100%, 좌측 반만이면 50%, 아니면 0%
                    const fillPercent =
                      displayScore >= rightScore
                        ? 100
                        : displayScore === leftScore
                          ? 50
                          : 0;
                    return (
                      <div key={i} className="relative size-7">
                        {/* 빈 별(바탕) */}
                        <Star
                          className="size-7 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {/* 채운 별(전체/반쪽) — 너비를 잘라 반 별 표현 */}
                        {fillPercent > 0 && (
                          <div
                            className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
                            style={{ width: `${fillPercent}%` }}
                          >
                            <Star
                              className="size-7 fill-current text-foreground"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                        {/* 좌측 절반 클릭 영역 (= 반 별, 2i+1점) */}
                        <button
                          type="button"
                          aria-label={`${leftScore}점`}
                          aria-pressed={selectedScore === leftScore}
                          className="absolute inset-y-0 left-0 w-1/2 rounded-l focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedScore(leftScore)}
                          onMouseEnter={() => setHoveredScore(leftScore)}
                          onMouseLeave={() => setHoveredScore(0)}
                        />
                        {/* 우측 절반 클릭 영역 (= 한 별, 2i+2점) */}
                        <button
                          type="button"
                          aria-label={`${rightScore}점`}
                          aria-pressed={selectedScore === rightScore}
                          className="absolute inset-y-0 right-0 w-1/2 rounded-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelectedScore(rightScore)}
                          onMouseEnter={() => setHoveredScore(rightScore)}
                          onMouseLeave={() => setHoveredScore(0)}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* 선택된 점수 텍스트 표시 (별 개수 = 점수/2) */}
                <p className="text-sm text-muted-foreground">
                  {selectedScore > 0
                    ? `${selectedScore}/10점 선택됨 (별 ${selectedScore / 2}개)`
                    : "별을 클릭해 점수를 선택하세요 (반 별 = 1점)"}
                </p>
              </div>

              {/* 코멘트 입력 (선택 사항) */}
              <div className="space-y-2">
                <label
                  htmlFor="rating-comment"
                  className="text-sm font-medium text-foreground"
                >
                  코멘트{" "}
                  <span className="font-normal text-muted-foreground">
                    (선택)
                  </span>
                </label>
                <textarea
                  id="rating-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="거래 경험을 자유롭게 작성해 주세요."
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* 제출 실패 안내 */}
            {submitError && (
              <p
                className="text-center text-xs font-medium text-destructive"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {/* 취소 버튼: 닫으면서 상태 초기화 */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              {/* 제출 버튼: 별점 미선택 시 비활성 */}
              <Button
                type="button"
                disabled={selectedScore === 0 || isSubmitting}
                aria-busy={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "제출 중..." : "제출"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
