import "server-only";
import { createHash, randomInt } from "node:crypto";
import nodemailer from "nodemailer";

// --- OTP 정책 상수 ---
export const OTP_CODE_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60; // 유효시간 5분
export const OTP_MAX_ATTEMPTS = 5; // 코드당 검증 시도 허용 횟수
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // 재전송 최소 간격
export const OTP_PURPOSE_SIGNUP = "signup";

/**
 * 앞자리 0 을 포함한 6자리 숫자 인증번호를 생성한다.
 * Math.random 대신 crypto 안전 난수(randomInt)를 사용한다.
 */
export function generateOtpCode(): string {
  const n = randomInt(0, 10 ** OTP_CODE_LENGTH); // 0 ~ 999999
  return n.toString().padStart(OTP_CODE_LENGTH, "0");
}

/**
 * 인증번호를 DB 에 평문으로 저장하지 않기 위한 해시.
 * (이메일 + 선택적 페퍼)를 함께 섞어 단순 레인보우 테이블 공격을 완화한다.
 */
export function hashOtpCode(email: string, code: string): string {
  const pepper = process.env.OTP_PEPPER ?? "";
  return createHash("sha256")
    .update(`${pepper}:${email.toLowerCase()}:${code}`)
    .digest("hex");
}

/**
 * 인증번호를 이메일로 발송한다. .env.local 의 SMTP_* 값을 사용한다.
 * (호스티드 Supabase Auth 와 무관하게, 이 앱이 직접 메일을 보낸다.)
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP 환경변수가 설정되지 않았습니다. .env.local 의 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS 를 확인하세요."
    );
  }

  const port = Number(SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465=SSL, 587=STARTTLS
    requireTLS: port === 587,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const minutes = Math.floor(OTP_TTL_SECONDS / 60);

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject: "[회원가입] 이메일 인증번호",
    text: `회원가입 인증번호는 ${code} 입니다. ${minutes}분 안에 입력해 주세요.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">이메일 인증번호</h2>
        <p style="color: #555;">아래 6자리 인증번호를 회원가입 화면에 입력해 주세요.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">${code}</p>
        <p style="color: #888; font-size: 13px;">유효시간 ${minutes}분. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
      </div>
    `,
  });
}
