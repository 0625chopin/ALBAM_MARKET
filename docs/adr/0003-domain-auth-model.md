# ADR-0003 · 도메인 · 인증 모델 (admin 자체 로그인)

- **상태**: 채택(Accepted) · 2026-07-04
- **관련 태스크**: TS03(본 문서) · TS16(admin 자체 로그인 구현) · TS17(admin proxy 가드 골격) · TA057(admin_users 실게이팅)
- **상위**: [`../division.md`](../division.md), [`0001-shared-distribution-mechanism.md`](./0001-shared-distribution-mechanism.md)

---

## 1. 도메인 표기

| 앱        | 레포                      | 도메인(예시 · 최종은 계정 소유자 확정)           |
| --------- | ------------------------- | ------------------------------------------------ |
| 공개 앱   | `0625chopin/ALBAM_MARKET` | `almbam.example`(운영 도메인)                    |
| 관리자 앱 | `albam-admin`(신규)       | `admin.almbam.example` **또는 완전 별도 도메인** |

> 실제 도메인 문자열은 TS19(Vercel 도메인 연결) 시 계정 소유자가 확정한다. 본 ADR은 **인증 모델**을
> 도메인 선택과 무관하게 성립하도록 설계한다(아래 §3 채택안).

## 2. 쿠키 격리 사실 (근거)

- Supabase Auth 세션은 `@supabase/ssr`이 **쿠키**로 유지한다(`lib/supabase/{server,proxy}.ts`).
- **쿠키는 도메인에 귀속**된다:
  - 공개 앱과 admin이 **완전히 다른 도메인**이면 세션 쿠키를 공유할 수 없다.
  - 같은 상위도메인의 **서브도메인**(`almbam.example` ↔ `admin.almbam.example`)이면 쿠키 도메인을
    `.almbam.example`로 넓혀 공유가 **가능은** 하다.

## 3. 채택 — admin 자체 로그인 (도메인 선택과 무관하게 성립)

관리자 앱은 **자체 로그인 플로우**를 갖는다.

- **동일 Supabase Auth 백엔드**(같은 프로젝트 `zmeyfvfkqnemnzafpzmn`)에 대해 admin 앱에서
  `supabase.auth.signInWithPassword({ email, password })`로 로그인한다.
- 로그인 성공 후 **`admin_users` 소속 게이팅**: 세션 사용자의 `auth.uid()`가 `admin_users`에 있어야
  관리자 콘솔 진입 허용. 없으면 즉시 로그아웃/거부(일반 회원 계정으로는 admin 진입 불가).
- 세션 쿠키는 **admin 도메인에 격리**된다(공개 앱 세션과 물리적으로 분리).

### 계약 (인터페이스)

```
[admin 앱]
POST /login (client)
  → shared: createClient(browser).auth.signInWithPassword({ email, password })
  → 성공 시 서버에서 admin_users 소속 확인(RLS 또는 is_admin())
      · 소속 O → 관리자 콘솔 진입 허용
      · 소속 X → signOut + "관리자 권한 없음" (일반 회원 세션 무효화)
[admin 앱] proxy.ts (미들웨어)
  → 세션 없음 → /login 리다이렉트 (TS17 골격)
  → 세션 있음 + admin_users 소속 아님 → 거부/로그아웃 (실게이팅 TA057)
```

- 게이팅 판정(`admin_users`/`is_admin()`)의 **실제 구현은 TA057**(A5). 본 ADR/TS16~TS17은 로그인
  플로우와 세션 가드 **골격**까지.

## 4. 대안 — 서브도메인 + 쿠키 도메인 공유 (비채택)

- 방식: admin을 `admin.almbam.example` 서브도메인에 두고 쿠키 도메인 `.almbam.example`로 세션 공유
  → 공개 앱에서 로그인하면 admin도 자동 인증.
- **비채택 근거**:
  1. **격리 약화**: 공개 세션이 그대로 admin으로 넘어와 "보안 격리" 목적에 역행. 공개 앱 XSS/세션
     탈취가 admin 표면으로 직결.
  2. **결합 증가**: 두 앱의 쿠키/도메인 구성이 강결합 → "완전 별도 레포/독립 배포"와 상충. 도메인
     전략 변경 시 양쪽 동시 수정.
  3. **관리자 세션 수명/정책을 공개와 분리**하기 어려움(예: admin 짧은 만료·재인증).
- 자체 로그인은 도메인이 서브도메인이든 완전 별도든 **동일하게 성립**하므로 유연성도 더 높다.

## 5. 검증 대응(완료 기준)

- ✅ 도메인 표기(§1, 최종은 TS19).
- ✅ 쿠키 격리 사실(§2).
- ✅ admin 로그인 계약 = `signInWithPassword` + `admin_users` 게이팅(§3).
- ✅ 서브도메인 쿠키 공유 대안 비채택 근거(§4).
