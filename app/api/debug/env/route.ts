import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * [임시 진단용] 배포 환경에서 어떤 환경변수가 런타임에 실제로 들어와 있는지
 * 값 노출 없이(존재 여부 boolean + 길이만) 확인한다.
 * 진단 후 이 파일을 반드시 삭제할 것.
 */
export async function GET() {
  // headers() 를 호출해 런타임(동적) 실행을 강제한다(cacheComponents 로 인한 빌드타임 캐싱 방지).
  await headers();

  const present = (v?: string) => typeof v === "string" && v.length > 0;

  return NextResponse.json({
    // 지금 이 함수가 실행되는 배포 환경: production | preview | development
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    hasServiceRoleKey: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    // 신규 secret 키 형식인지(sb_secret_...). false 면 아직 레거시 JWT 를 쓰는 중.
    serviceRoleKeyIsNewFormat: (
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    ).startsWith("sb_secret_"),
    hasSupabaseUrl: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasPublishableKey: present(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
    publishableKeyLength:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length ?? 0,
    // 신규 publishable 형식인지(sb_publishable_...). false 면 폐기된 레거시 anon → 앱 전체 깨짐.
    publishableKeyIsNewFormat: (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
    ).startsWith("sb_publishable_"),
    hasSmtpHost: present(process.env.SMTP_HOST),
    hasSmtpPort: present(process.env.SMTP_PORT),
    hasSmtpUser: present(process.env.SMTP_USER),
    hasSmtpPass: present(process.env.SMTP_PASS),
    hasSmtpFrom: present(process.env.SMTP_FROM),
  });
}
