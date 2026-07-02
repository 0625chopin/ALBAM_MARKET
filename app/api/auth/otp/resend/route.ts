import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueAndSendOtp } from "@/lib/auth/otp-service";

// Route Handler 는 기본이 Node.js 런타임이므로 별도 선언하지 않는다(cacheComponents 호환).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 인증번호 재전송. 검증 페이지에는 이메일만 있으므로 { email } 만 받는다.
 * 이미 생성된 "미인증" 유저에 한해 재발급한다(이미 인증 완료된 이메일은 거부).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "올바른 이메일을 입력해 주세요." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: found, error: findErr } = await admin.rpc("otp_find_user", {
    p_email: email,
  });
  if (findErr) {
    return NextResponse.json(
      { error: "일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
  const existing = found?.[0];

  if (!existing) {
    return NextResponse.json(
      {
        error: "가입 진행 중인 계정이 없습니다. 회원가입을 다시 시작해 주세요.",
      },
      { status: 404 }
    );
  }
  if (existing.email_confirmed) {
    return NextResponse.json(
      { error: "이미 인증이 완료된 이메일입니다." },
      { status: 409 }
    );
  }

  const result = await issueAndSendOtp(admin, email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true });
}
