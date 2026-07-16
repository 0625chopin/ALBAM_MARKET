/**
 * Supabase 인증 에러 메시지를 한글로 매핑한다.
 *
 * Supabase가 내려주는 영문 메시지는 상황에 따라 문구가 바뀔 수 있어,
 * 대표적인 패턴을 부분 일치(소문자 비교)로 검사한 뒤 한글 문구로 치환한다.
 * 매핑되지 않은 메시지는 원문을 그대로 반환한다.
 */
const ERROR_MESSAGE_MAP: { match: string; message: string }[] = [
  {
    match: "invalid login credentials",
    message: "이메일 또는 비밀번호가 올바르지 않습니다.",
  },
  {
    match: "email not confirmed",
    message: "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.",
  },
  {
    match: "user already registered",
    message: "이미 가입된 이메일입니다.",
  },
  {
    match: "user not found",
    message: "등록되지 않은 사용자입니다.",
  },
  {
    match: "email address is invalid",
    message: "유효하지 않은 이메일 주소입니다.",
  },
  {
    match: "password should be at least",
    message: "비밀번호는 최소 6자 이상이어야 합니다.",
  },
  {
    match: "password is too weak",
    message: "비밀번호가 너무 취약합니다. 더 복잡하게 설정해주세요.",
  },
  {
    match: "email rate limit exceeded",
    message: "이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.",
  },
  {
    match: "over_email_send_rate_limit",
    message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
  {
    match: "for security purposes",
    message: "보안을 위해 잠시 후 다시 시도해주세요.",
  },
  {
    match: "token has expired",
    message: "인증 링크가 만료되었습니다. 다시 요청해주세요.",
  },
  {
    match: "invalid or expired",
    message: "인증 정보가 유효하지 않거나 만료되었습니다.",
  },
  {
    match: "network",
    message: "네트워크 오류가 발생했습니다. 연결 상태를 확인해주세요.",
  },
  {
    match: "failed to fetch",
    message: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  },
];

/**
 * 알 수 없는 에러에 사용할 기본 문구.
 */
const DEFAULT_ERROR_MESSAGE = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

/**
 * Supabase 등에서 발생한 에러를 한글 메시지로 변환한다.
 *
 * @param error - catch 블록에서 받은 알 수 없는 형태의 에러
 * @returns 매핑된 한글 메시지 (없으면 원문 또는 기본 문구)
 */
export function getAuthErrorMessage(error: unknown): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!rawMessage) return DEFAULT_ERROR_MESSAGE;

  const lower = rawMessage.toLowerCase();
  const matched = ERROR_MESSAGE_MAP.find((item) => lower.includes(item.match));

  return matched?.message ?? rawMessage;
}
