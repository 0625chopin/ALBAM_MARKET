"use client";

// 닉네임/이메일 실시간 중복 확인 훅 (회원가입 · 프로필 수정 공용)
// 형식 검증 → 디바운스(500ms) 후 서버(/api/auth/check-availability) 확인.
// 입력이 바뀌면 이전 요청 결과는 무시한다(requestId 로 최신 요청만 반영).

import { useEffect, useRef } from "react";

// 중복 확인 필드 상태: 미확인 / 확인 중 / 사용 가능 / 사용 불가
export type FieldStatus = "idle" | "checking" | "available" | "unavailable";

interface AvailabilityOptions {
  /** 중복 검사에서 제외할 사용자 id (프로필 수정 시 본인 행 제외) */
  excludeId?: string;
  /** 현재 저장된 값. 입력이 이 값과 같으면 변경 없음으로 보고 서버 호출을 건너뛴다. */
  initialValue?: string;
}

export function useAvailabilityCheck(
  type: "nickname" | "email",
  value: string,
  validate: (v: string) => string | null,
  setStatus: (s: FieldStatus) => void,
  setMsg: (m: string | null) => void,
  options?: AvailabilityOptions
) {
  const reqIdRef = useRef(0);
  const excludeId = options?.excludeId;
  const initialValue = options?.initialValue;

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === "") {
      setStatus("idle");
      setMsg(null);
      return;
    }
    // 변경 없음(현재 저장된 값과 동일)이면 서버 호출 없이 통과 처리한다.
    if (initialValue !== undefined && trimmed === initialValue.trim()) {
      setStatus("available");
      setMsg(null);
      return;
    }
    const formatError = validate(trimmed);
    if (formatError) {
      setStatus("unavailable");
      setMsg(formatError);
      return;
    }

    setStatus("checking");
    setMsg("확인 중...");
    const reqId = ++reqIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ type, value: trimmed });
        if (excludeId) params.set("excludeId", excludeId);
        const res = await fetch(
          `/api/auth/check-availability?${params.toString()}`
        );
        const data = (await res.json().catch(() => ({}))) as {
          available?: boolean;
          reason?: string;
        };
        // 그 사이 값이 바뀌었다면(최신 요청이 아니면) 결과를 버린다.
        if (reqId !== reqIdRef.current) return;
        if (data.available) {
          setStatus("available");
          setMsg("사용 가능합니다.");
        } else {
          setStatus("unavailable");
          setMsg(data.reason ?? "사용할 수 없습니다.");
        }
      } catch {
        if (reqId !== reqIdRef.current) return;
        setStatus("idle");
        setMsg(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [type, value, validate, setStatus, setMsg, excludeId, initialValue]);
}

// 상태별 안내 문구 색상: 사용 가능(초록) / 불가(빨강) / 그 외(muted)
export function statusClass(status: FieldStatus) {
  if (status === "available") return "text-green-600 dark:text-green-500";
  if (status === "unavailable") return "text-red-500";
  return "text-muted-foreground";
}
