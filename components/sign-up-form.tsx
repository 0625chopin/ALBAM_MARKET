"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail, validateNickname } from "@/lib/auth/validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// 중복 확인 필드 상태: 미확인 / 확인 중 / 사용 가능 / 사용 불가
type FieldStatus = "idle" | "checking" | "available" | "unavailable";

// 중복 확인 공통 훅: 형식 검증 → 디바운스 후 서버 확인.
// 입력이 바뀌면 이전 요청 결과는 무시하도록 requestId 로 최신 요청만 반영한다.
function useAvailabilityCheck(
  type: "nickname" | "email",
  value: string,
  validate: (v: string) => string | null,
  setStatus: (s: FieldStatus) => void,
  setMsg: (m: string | null) => void
) {
  const reqIdRef = useRef(0);
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === "") {
      setStatus("idle");
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
        const res = await fetch(
          `/api/auth/check-availability?type=${type}&value=${encodeURIComponent(trimmed)}`
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
  }, [type, value, validate, setStatus, setMsg]);
}

// 상태별 안내 문구 색상: 사용 가능(초록) / 불가(빨강) / 그 외(muted)
function statusClass(status: FieldStatus) {
  if (status === "available") return "text-green-600 dark:text-green-500";
  if (status === "unavailable") return "text-red-500";
  return "text-muted-foreground";
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 닉네임/이메일 실시간 중복 확인 상태와 안내 메시지
  const [nicknameStatus, setNicknameStatus] = useState<FieldStatus>("idle");
  const [nicknameMsg, setNicknameMsg] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<FieldStatus>("idle");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const router = useRouter();

  useAvailabilityCheck(
    "nickname",
    nickname,
    validateNickname,
    setNicknameStatus,
    setNicknameMsg
  );
  useAvailabilityCheck(
    "email",
    email,
    validateEmail,
    setEmailStatus,
    setEmailMsg
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    if (nickname.trim() === "") {
      setError("닉네임을 입력해 주세요.");
      setIsLoading(false);
      return;
    }

    // 중복 확인이 끝나지 않았거나 사용 불가한 값이면 제출을 막는다.
    if (nicknameStatus === "unavailable" || emailStatus === "unavailable") {
      setError("닉네임/이메일 중복 여부를 확인해 주세요.");
      setIsLoading(false);
      return;
    }
    if (nicknameStatus === "checking" || emailStatus === "checking") {
      setError("중복 확인이 진행 중입니다. 잠시만 기다려 주세요.");
      setIsLoading(false);
      return;
    }

    try {
      // 커스텀 OTP 1단계: 서버가 미인증 유저를 만들고 6자리 인증번호를 이메일로 발송한다.
      // 비밀번호는 이 요청에서만 서버로 전달되고 이후 단계로 넘기지 않는다(세션은 서버가 발급).
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname: nickname.trim() }),
      });
      // 서버가 빈 본문/비-JSON(예: 500)을 반환해도 안전하게 파싱한다.
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "회원가입 요청에 실패했습니다.");
      }
      // 발송된 6자리 코드를 입력받기 위해 인증 화면으로 이동(이메일 전달)
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // 콜백 라우트에서 code를 세션으로 교환한 뒤 /protected로 이동
          redirectTo: `${window.location.origin}/auth/callback?next=/protected`,
        },
      });
      if (error) throw error;
      // 성공 시 브라우저가 Google 동의 화면으로 리다이렉트되므로 별도 처리 불필요
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="알밤이"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  aria-invalid={nicknameStatus === "unavailable"}
                />
                {nicknameMsg && (
                  <p className={cn("text-xs", statusClass(nicknameStatus))}>
                    {nicknameMsg}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={emailStatus === "unavailable"}
                />
                {emailMsg && (
                  <p className={cn("text-xs", statusClass(emailStatus))}>
                    {emailMsg}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  nicknameStatus === "checking" ||
                  emailStatus === "checking" ||
                  nicknameStatus === "unavailable" ||
                  emailStatus === "unavailable"
                }
              >
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>

              <div className="relative text-center text-sm">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
                <div className="absolute inset-0 top-1/2 z-0 border-t border-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"
                  />
                </svg>
                Google로 시작하기
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
