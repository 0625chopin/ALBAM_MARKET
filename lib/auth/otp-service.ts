import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@0625chopin/shared/database";
import {
  generateOtpCode,
  hashOtpCode,
  sendOtpEmail,
  OTP_TTL_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_PURPOSE_SIGNUP,
} from "./otp";

type AdminClient = SupabaseClient<Database>;

export type OtpServiceResult =
  { ok: true } | { ok: false; status: number; error: string };

/**
 * 이메일 인증번호를 발급(저장)하고 메일로 발송하는 공용 로직.
 * 최초 요청(request)과 재전송(resend) 라우트가 함께 사용한다.
 *
 * 흐름: 재전송 쿨다운 확인 → 기존 미사용 코드 무효화 → 새 코드 저장 → 메일 발송.
 * 서버(service_role) 전용 admin 클라이언트를 받아 RLS 를 우회한다.
 */
export async function issueAndSendOtp(
  admin: AdminClient,
  email: string
): Promise<OtpServiceResult> {
  // 1) 재전송 쿨다운: 가장 최근 발급 시각 확인
  const { data: recent } = await admin
    .from("email_verifications")
    .select("created_at")
    .eq("email", email)
    .eq("purpose", OTP_PURPOSE_SIGNUP)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
      return {
        ok: false,
        status: 429,
        error: `잠시 후 다시 시도해 주세요. (${wait}초)`,
      };
    }
  }

  // 2) 이전 미사용 코드 무효화(항상 최신 1개만 유효하도록)
  await admin
    .from("email_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .eq("purpose", OTP_PURPOSE_SIGNUP)
    .is("consumed_at", null);

  // 3) 새 코드 생성/저장(해시로 저장)
  const code = generateOtpCode();
  const { error: insErr } = await admin.from("email_verifications").insert({
    email,
    code_hash: hashOtpCode(email, code),
    purpose: OTP_PURPOSE_SIGNUP,
    expires_at: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
  });
  if (insErr) {
    return { ok: false, status: 500, error: "인증번호 저장에 실패했습니다." };
  }

  // 4) 메일 발송(실패 시 방금 저장한 코드는 만료되도록 두고 오류 반환)
  try {
    await sendOtpEmail(email, code);
  } catch {
    return {
      ok: false,
      status: 502,
      error: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true };
}
