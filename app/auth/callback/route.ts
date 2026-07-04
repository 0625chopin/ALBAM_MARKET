import { createClient } from "@0625chopin/shared/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth(예: Google) 및 PKCE 기반 인증 콜백 핸들러.
 * 공급자 로그인 후 돌아온 `code`를 세션으로 교환하고,
 * 성공 시 `next`(기본 /protected)로 리다이렉트합니다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 로컬 개발과 프록시/로드밸런서 환경을 모두 지원하기 위한 호스트 처리
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    // 코드 교환 실패 시 에러 페이지로 이동
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  // code 파라미터가 없는 비정상 접근
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("No code provided in callback")}`
  );
}
