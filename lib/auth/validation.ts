// 회원가입 입력값 검증 규칙 — 서버(Route Handler)와 클라이언트(폼)가 함께 사용한다.
// 순수 함수/정규식만 두어 클라이언트 번들에 포함돼도 안전하도록 한다(server-only 의존 없음).

/** 이메일 형식 검사용 정규식(공백/@ 기준의 최소 검증). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

/** 닉네임 허용 문자: 한글/영문/숫자/밑줄, 2~20자. */
export const NICKNAME_RE = new RegExp(
  `^[가-힣a-zA-Z0-9_]{${NICKNAME_MIN},${NICKNAME_MAX}}$`
);

/**
 * 닉네임 형식 검증. 통과 시 null, 실패 시 사용자용 오류 메시지를 반환한다.
 */
export function validateNickname(nickname: string): string | null {
  const value = nickname.trim();
  if (value.length === 0) return "닉네임을 입력해 주세요.";
  if (!NICKNAME_RE.test(value)) {
    return `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자의 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.`;
  }
  return null;
}

/**
 * 이메일 형식 검증. 통과 시 null, 실패 시 사용자용 오류 메시지를 반환한다.
 */
export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email.trim().toLowerCase())) {
    return "올바른 이메일을 입력해 주세요.";
  }
  return null;
}
