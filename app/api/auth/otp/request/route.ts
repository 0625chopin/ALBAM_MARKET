import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@0625chopin/shared/supabase/admin";
import { issueAndSendOtp } from "@/lib/auth/otp-service";
import { EMAIL_RE, validateNickname } from "@/lib/auth/validation";

// Route Handler 는 기본이 Node.js 런타임이므로 별도 선언하지 않는다.
// (이 프로젝트는 cacheComponents 를 켜 두어 runtime 세그먼트 설정과 호환되지 않음.)

type RequestBody = {
  email?: string;
  password?: string;
  nickname?: string;
};

/**
 * 회원가입 1단계: 미인증 유저를 생성하고 이메일로 6자리 인증번호를 발송한다.
 * 비밀번호는 이 요청에서 1회만 전달받아 유저 생성에 사용하고, DB(email_verifications)에는 저장하지 않는다.
 */
export async function POST(request: NextRequest) {
  // 어떤 예외가 나도 항상 JSON 을 반환한다(클라이언트의 res.json() 파싱 실패 방지).
  try {
    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const nickname = body.nickname?.trim() ?? "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일을 입력해 주세요." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }
    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json({ error: nicknameError }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1) 기존 유저 조회(이메일 확인 여부 포함)
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

    if (existing?.email_confirmed) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다. 로그인해 주세요." },
        { status: 409 }
      );
    }

    // 닉네임 중복 서버 최종 검증(실시간 확인 API 우회 방어).
    // 미인증 유저 재요청 시 본인 프로필은 제외한다.
    const { data: nickTaken, error: nickErr } = await admin.rpc(
      "nickname_exists",
      existing
        ? { p_nickname: nickname, p_exclude_id: existing.id }
        : { p_nickname: nickname }
    );
    if (nickErr) {
      return NextResponse.json(
        { error: "일시적인 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    if (nickTaken) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다." },
        { status: 409 }
      );
    }

    if (existing) {
      // 미인증 유저(가입 중 이탈 등) → 비밀번호/닉네임 갱신 후 재발급
      const { error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        { password, user_metadata: { nickname } }
      );
      if (updErr) {
        return NextResponse.json(
          { error: "가입 정보 갱신에 실패했습니다." },
          { status: 500 }
        );
      }
      // handle_new_user 트리거는 INSERT 시점에만 동작하므로, 재요청 때 바뀐 닉네임을
      // 프로필에도 반영한다(트리거로는 갱신되지 않음).
      await admin.from("profiles").update({ nickname }).eq("id", existing.id);
    } else {
      // 신규 유저 생성(이메일 미확인 상태). handle_new_user 트리거가 nickname 으로 프로필을 채운다.
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: { nickname },
        });
      if (createErr || !created.user) {
        // 경합으로 닉네임 UNIQUE 인덱스(트리거의 profiles insert)가 위반된 경우 친절한 메시지로 변환.
        const msg = createErr?.message ?? "";
        if (/nickname/i.test(msg) || /duplicate key/i.test(msg)) {
          return NextResponse.json(
            { error: "이미 사용 중인 닉네임입니다." },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: msg || "회원 생성에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 2) 인증번호 발급 + 발송
    const result = await issueAndSendOtp(admin, email);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // 환경변수 미설정(SUPABASE_SERVICE_ROLE_KEY 등)이나 예기치 못한 오류를 여기서 잡는다.
    console.error("[otp/request] 처리 중 오류:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
