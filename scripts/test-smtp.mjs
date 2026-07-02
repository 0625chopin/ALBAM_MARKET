// 로컬 SMTP 검증 스크립트
//
// 목적: Supabase 대시보드에 넣기 전에, Gmail SMTP 자격증명(계정/앱 비밀번호)이
//       실제로 로그인·발송 가능한지 로컬에서 먼저 확인한다.
//       - 535 BadCredentials 가 나면 앱 비밀번호/2단계 인증 문제 (Supabase 무관).
//       - 여기서 성공하면 자격증명은 정상 → Supabase 대시보드 입력값만 맞추면 됨.
//
// 실행: npm run test:smtp
//
// 주의: 이 스크립트의 SMTP 값은 .env.local 에서 읽는다. 호스티드 Supabase Auth 는
//       이 값을 사용하지 않는다(대시보드 SMTP 설정과 별개).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// .env.local → .env 순으로 읽어 process.env 에 주입(이미 설정된 값은 유지)
function loadEnv(fileName) {
  try {
    const raw = readFileSync(join(projectRoot, fileName), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // 파일 없으면 무시
  }
}

loadEnv(".env.local");
loadEnv(".env");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.error(
    "❌ SMTP 환경변수가 부족합니다. .env.local 에 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS 를 설정하세요."
  );
  process.exit(1);
}

const port = Number(SMTP_PORT);
const from = SMTP_FROM || SMTP_USER;
const to = SMTP_TO || SMTP_USER;

console.log("SMTP 설정 확인:");
console.log(`  host: ${SMTP_HOST}`);
console.log(`  port: ${port} (${port === 465 ? "SSL" : "STARTTLS"})`);
console.log(`  user: ${SMTP_USER}`);
console.log(`  pass: ${"*".repeat(SMTP_PASS.length)} (${SMTP_PASS.length}자)`);
console.log(`  from: ${from}`);
console.log(`  to  : ${to}`);
console.log("");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465, // 465=SSL, 587=STARTTLS
  requireTLS: port === 587,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

try {
  // 1단계: 로그인 검증 (여기서 535 면 자격증명 문제)
  console.log("① SMTP 로그인 검증(verify) 중...");
  await transporter.verify();
  console.log("   ✅ 로그인 성공");

  // 2단계: 실제 테스트 메일 발송
  console.log("② 테스트 메일 발송 중...");
  const info = await transporter.sendMail({
    from,
    to,
    subject: "[테스트] SMTP 발송 확인",
    text: "이 메일이 도착했다면 SMTP 자격증명이 정상 동작합니다.",
  });
  console.log(`   ✅ 발송 성공 (messageId: ${info.messageId})`);
  console.log(`   응답: ${info.response}`);
  console.log(
    "\n🎉 SMTP 정상. 동일한 값을 Supabase 대시보드 SMTP 설정에 넣으면 됩니다."
  );
} catch (err) {
  console.error("\n❌ SMTP 실패:");
  console.error(
    `   코드: ${err.code ?? "-"} / 응답코드: ${err.responseCode ?? "-"}`
  );
  console.error(`   메시지: ${err.message}`);
  if (String(err.message).includes("535") || err.responseCode === 535) {
    console.error(
      "\n👉 535 BadCredentials: 앱 비밀번호가 거부됐습니다.\n" +
        "   - 해당 Gmail 계정에 2단계 인증이 켜져 있는지 확인\n" +
        "   - https://myaccount.google.com/apppasswords 에서 앱 비밀번호를 새로 발급\n" +
        "   - 발급된 16자리를 공백 없이 SMTP_PASS 에 입력\n" +
        "   - SMTP_USER 는 전체 Gmail 주소여야 함"
    );
  }
  process.exit(1);
}
