import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashOtpCode, OTP_PURPOSE_SIGNUP } from "@/lib/auth/otp";

// Route Handler 는 기본이 Node.js 런타임이므로 별도 선언하지 않는다(cacheComponents 호환).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 회원가입 2단계: 6자리 인증번호를 검증하고, 성공 시 이메일 인증 처리 + 세션 발급.
 *
 * 세션 발급: admin.generateLink 로 magiclink 토큰을 생성(메일은 발송되지 않음)한 뒤,
 * 쿠키 기반 서버 클라이언트로 verifyOtp 를 호출해 세션 쿠키를 설정한다.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { email?: string; code?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const email = body.email?.trim().toLowerCase() ?? "";
    const code = (body.code ?? "").replace(/\D/g, "");

    if (!EMAIL_RE.test(email) || code.length !== 6) {
      return NextResponse.json(
        { error: "이메일과 6자리 인증번호를 확인해 주세요." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1) 가장 최근의 미사용 코드 조회
    const { data: row, error: selErr } = await admin
      .from("email_verifications")
      .select("id, code_hash, expires_at, attempts, max_attempts")
      .eq("email", email)
      .eq("purpose", OTP_PURPOSE_SIGNUP)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json(
        { error: "일시적인 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { error: "인증번호를 먼저 요청해 주세요." },
        { status: 400 }
      );
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "인증번호가 만료되었습니다. 재전송해 주세요." },
        { status: 400 }
      );
    }
    if (row.attempts >= row.max_attempts) {
      return NextResponse.json(
        { error: "시도 횟수를 초과했습니다. 재전송해 주세요." },
        { status: 429 }
      );
    }

    // 2) 코드 대조
    if (row.code_hash !== hashOtpCode(email, code)) {
      const nextAttempts = row.attempts + 1;
      await admin
        .from("email_verifications")
        .update({ attempts: nextAttempts })
        .eq("id", row.id);
      const remaining = row.max_attempts - nextAttempts;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `인증번호가 올바르지 않습니다. (남은 시도 ${remaining}회)`
              : "인증번호가 올바르지 않습니다. 재전송해 주세요.",
        },
        { status: 400 }
      );
    }

    // 3) 성공 → 코드 소비 처리
    await admin
      .from("email_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    // 4) 유저 이메일 인증 처리
    const { data: found } = await admin.rpc("otp_find_user", {
      p_email: email,
    });
    const user = found?.[0];
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다. 회원가입을 다시 시작해 주세요." },
        { status: 404 }
      );
    }

    const { error: confErr } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (confErr) {
      return NextResponse.json(
        { error: "이메일 인증 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 5) 세션 발급: magiclink 토큰 생성(메일 미발송) → verifyOtp 로 쿠키 설정
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      return NextResponse.json(
        {
          error: "세션 발급에 실패했습니다. 로그인 페이지에서 로그인해 주세요.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    // magiclink 로 생성된 token_hash 는 type "email" 로 검증한다(Supabase 문서 기준).
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (verifyErr) {
      return NextResponse.json(
        {
          error: "세션 발급에 실패했습니다. 로그인 페이지에서 로그인해 주세요.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[otp/verify] 처리 중 오류:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
