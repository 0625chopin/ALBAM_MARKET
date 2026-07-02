"use client";

import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 재전송 쿨다운(초). 가입 직후 이미 코드가 1회 발송되므로 초기값으로 시작한다.
const RESEND_COOLDOWN = 60;

export function VerifyOtpForm({
  email,
  className,
  ...props
}: { email: string } & React.ComponentPropsWithoutRef<"div">) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const router = useRouter();

  // 쿨다운 카운트다운
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 이메일 정보가 없으면 정상적인 진입이 아니므로 가입 화면으로 안내
  if (!email) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">잘못된 접근</CardTitle>
            <CardDescription>
              인증할 이메일 정보가 없습니다. 회원가입을 다시 시작해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/sign-up">회원가입으로 이동</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 커스텀 OTP 2단계: 서버가 코드를 검증하고 성공 시 세션 쿠키를 발급한다.
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "인증에 실패했습니다.");
      }
      // 세션이 발급된 상태이므로 서버 컴포넌트가 최신 세션을 읽도록 refresh 후 이동.
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "인증에 실패했습니다. 코드를 다시 확인해 주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "재전송에 실패했습니다.");
      }
      setMessage("인증번호를 다시 보냈습니다. 이메일을 확인해 주세요.");
      setCooldown(RESEND_COOLDOWN);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "재전송에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">인증번호 입력</CardTitle>
          <CardDescription>
            {email}로 보낸 6자리 인증번호를 입력해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="code">인증번호</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "인증 중..." : "인증 완료"}
              </Button>
              <div className="text-muted-foreground text-center text-sm">
                인증번호를 받지 못하셨나요?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="underline underline-offset-4 disabled:no-underline disabled:opacity-60"
                >
                  {cooldown > 0 ? `재전송 (${cooldown}초)` : "재전송"}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
