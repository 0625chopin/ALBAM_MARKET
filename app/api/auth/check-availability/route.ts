import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateEmail, validateNickname } from "@/lib/auth/validation";

// Route Handler 는 기본이 Node.js 런타임이므로 별도 선언하지 않는다.
// (cacheComponents 와 runtime 세그먼트 설정이 호환되지 않음.)

type AvailabilityResult = {
  available: boolean;
  reason?: string;
};

/**
 * 회원가입 실시간 중복 확인 API.
 *   GET /api/auth/check-availability?type=nickname&value=알밤이
 *   GET /api/auth/check-availability?type=email&value=m@example.com
 *
 * 응답: { available: boolean, reason?: string }
 * - 형식 오류/중복이면 available=false 와 사용자용 사유(reason)를 함께 반환한다.
 * - 이 검사는 UX 보조용이며, 최종 방어는 회원가입(otp/request) 라우트와 DB UNIQUE 제약이 담당한다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const value = (searchParams.get("value") ?? "").trim();

    if (type === "nickname") {
      const formatError = validateNickname(value);
      if (formatError) {
        return NextResponse.json<AvailabilityResult>({
          available: false,
          reason: formatError,
        });
      }

      const admin = createAdminClient();
      const { data: taken, error } = await admin.rpc("nickname_exists", {
        p_nickname: value,
      });
      if (error) {
        return NextResponse.json<AvailabilityResult>(
          { available: false, reason: "확인 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      return NextResponse.json<AvailabilityResult>(
        taken
          ? { available: false, reason: "이미 사용 중인 닉네임입니다." }
          : { available: true }
      );
    }

    if (type === "email") {
      const email = value.toLowerCase();
      const formatError = validateEmail(email);
      if (formatError) {
        return NextResponse.json<AvailabilityResult>({
          available: false,
          reason: formatError,
        });
      }

      const admin = createAdminClient();
      // 인증 완료된 이메일만 "사용 중"으로 취급한다.
      // (가입 도중 이탈한 미인증 유저는 재가입/재발급이 가능해야 하므로 사용 가능으로 본다.)
      const { data: found, error } = await admin.rpc("otp_find_user", {
        p_email: email,
      });
      if (error) {
        return NextResponse.json<AvailabilityResult>(
          { available: false, reason: "확인 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
      const existing = found?.[0];
      return NextResponse.json<AvailabilityResult>(
        existing?.email_confirmed
          ? { available: false, reason: "이미 가입된 이메일입니다." }
          : { available: true }
      );
    }

    return NextResponse.json<AvailabilityResult>(
      { available: false, reason: "잘못된 요청입니다." },
      { status: 400 }
    );
  } catch (e) {
    console.error("[check-availability] 처리 중 오류:", e);
    return NextResponse.json<AvailabilityResult>(
      { available: false, reason: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
