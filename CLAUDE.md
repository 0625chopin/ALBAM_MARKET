# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js(App Router) + Supabase 인증 스타터킷입니다. `@supabase/ssr`을 사용해 쿠키 기반 세션을 Client/Server Component, Route Handler, 미들웨어 전반에서 공유합니다.

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint (eslint.config.mjs, flat config)
npm run format       # Prettier 전체 포맷 적용 (--write)
npm run format:check # Prettier 포맷 검사만 (--check)
npm run typecheck    # tsc --noEmit 타입체크
npm run check-all    # lint + format:check + typecheck 일괄 실행
```

- **테스트 러너는 없습니다.** 그 외 lint/format/typecheck/check-all 스크립트가 갖춰져 있습니다.
- 커밋 시 **Husky pre-commit 훅**이 자동으로 `lint-staged`(스테이징 파일에 ESLint --fix + Prettier) → `tsc --noEmit`(전체 타입체크)를 실행합니다. 타입/린트 오류가 있으면 커밋이 차단됩니다.
  - 설정: `.husky/pre-commit`, `package.json`의 `lint-staged` 키, `.prettierrc.json`, `.prettierignore`.
  - `eslint.config.mjs`는 `eslint-config-prettier`로 포맷 규칙 충돌을 제거하고, `.next`/빌드 산출물을 전역 무시합니다.

## 아키텍처 핵심

### Supabase 클라이언트 — 컨텍스트별로 3개 분리

세션을 망가뜨리지 않으려면 반드시 컨텍스트에 맞는 클라이언트를 써야 합니다. 전역 변수에 클라이언트를 캐싱하지 말고 **호출할 때마다 새로 생성**하세요 (Fluid compute 대응, 각 파일 주석에 명시됨).

- `lib/supabase/client.ts` — `createClient()`: 브라우저(Client Component)용. `createBrowserClient`.
- `lib/supabase/server.ts` — `async createClient()`: Server Component / Server Action / Route Handler용. `cookies()`를 `await`하여 주입. Server Component에서 쿠키 set이 실패하는 건 정상(try/catch로 무시)이며, 미들웨어가 세션을 갱신합니다.
- `lib/supabase/proxy.ts` — `updateSession()`: 미들웨어용. 매 요청마다 세션을 갱신하고 미인증 사용자를 `/auth/login`으로 리다이렉트.

### 미들웨어는 `middleware.ts`가 아니라 루트의 `proxy.ts`

이 프로젝트는 Next.js 최신(canary) 컨벤션을 따라 루트 `proxy.ts`에서 `proxy` 함수를 export합니다 (`lib/supabase/proxy.ts`의 `updateSession`을 호출). `config.matcher`로 정적 파일/이미지를 제외합니다.

**세션 버그 방지 규칙** (`lib/supabase/proxy.ts` 주석 참고, 위반 시 사용자가 무작위 로그아웃됨):

- `createServerClient`와 `supabase.auth.getClaims()` 사이에 어떤 코드도 넣지 말 것.
- `getClaims()` 호출을 제거하지 말 것.
- `supabaseResponse` 객체를 그대로 반환할 것. 새 응답을 만들면 쿠키를 반드시 복사할 것.

### 인증 라우트 구조

- `app/auth/*` — login, sign-up, sign-up-success, forgot-password, update-password, error 페이지.
- `app/auth/confirm/route.ts` — 이메일 OTP 검증(`verifyOtp`) Route Handler.
- `app/protected/*` — 인증 필요 영역. 미들웨어가 미인증 접근을 차단.
- 폼 컴포넌트(`components/login-form.tsx` 등)는 **Client Component이며 Supabase 클라이언트를 직접 호출**합니다 (`signInWithPassword` 등). Server Action을 쓰지 않습니다.

### 환경 변수

`.env.local`에 설정 (`.env.example` 없음):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (신규 publishable 키. 기존 anon 키도 이 변수명으로 사용 가능)

`lib/utils.ts`의 `hasEnvVars`가 두 변수 존재 여부를 검사하며, 미설정 시 미들웨어 세션 체크를 건너뛰고 UI에 경고를 표시합니다.

### UI / 스타일링

- **TailwindCSS v3.4.1** (`tailwind.config.ts`, `postcss.config.mjs`). v4 아님.
- shadcn/ui (`components.json`: new-york 스타일, `cssVariables: true`, lucide 아이콘). 컴포넌트는 `components/ui/`.
- `cn()` 헬퍼는 `lib/utils.ts` (clsx + tailwind-merge).
- 다크모드: `next-themes` (루트 레이아웃 `app/layout.tsx`의 `ThemeProvider`, `attribute="class"`).
- 경로 별칭: `@/*` → 루트 (`tsconfig.json`). 예: `@/components/ui/button`, `@/lib/supabase/server`.

### 기타

- `next.config.ts`에 `cacheComponents: true` (Cache Components / `use cache`). `next: latest`(canary)에 의존.
- `lib/database.types.ts` — Supabase 생성 타입. 현재 `public.profiles` 테이블만 정의됨. 스키마 변경 후 `mcp__supabase__generate_typescript_types`로 재생성하세요.
- Supabase 프로젝트 ref는 `.mcp.json`에 설정됨 (`project_ref=zmeyfvfkqnemnzafpzmn`).

## 문서와 실제 코드의 불일치 (주의)

`docs/guides/`의 가이드 문서들은 **일반적·이상적 설정을 서술한 것으로, 이 저장소의 실제 구성과 다릅니다.** 코드 작성 시 실제 코드/설정을 기준으로 삼으세요:

| 가이드 문서 서술                          | 실제 프로젝트                                            |
| ----------------------------------------- | -------------------------------------------------------- |
| `src/` 디렉터리 구조                      | `src/` 없음. `app/`, `components/`, `lib/`가 루트에 위치 |
| TailwindCSS v4                            | v3.4.1                                                   |
| react-hook-form + zod + Server Actions 폼 | 미설치. 폼은 `useState` + Supabase 클라이언트 직접 호출  |
| `experimental.typedRoutes`                | 미설정                                                   |

단, 가이드의 **원칙**(Server Component 우선, `'use client'` 최소화, async params/`cookies()` await, 시맨틱 색상 변수 사용, `cn()` 활용)은 실제 코드와 일치하며 따를 가치가 있습니다.

## MCP 서버

`.mcp.json`에 supabase, playwright, context7, sequential-thinking, shadcn, shrimp-task-manager가 구성되어 있습니다. Supabase 스키마/마이그레이션 작업은 supabase MCP 도구를 사용하세요.

## 개발 원칙

### 화면 우선 개발 (Mock First Development)

- 화면은 모두 component 단위로 합니다.
- 화면의 모든 컴포넌트는 https://localhost:3000/sample 에 보이도록 배치 합니다.
- 개발은 더미 데이터(Mock Data)로 화면(UI)부터 구현합니다.
- Database 설계 및 연결 전에 화면, 컴포넌트 구조, 사용자 경험(UX)을 먼저 완성합니다.
- Mock 데이터와 실제 Database 데이터는 동일한 TypeScript 타입을 사용하여 구현합니다.
- 화면 개발이 완료되면 Supabase Database를 설계 및 연결합니다.
- Database 연결 후 실제 데이터를 생성하여 CRUD, 인증(Authentication), 권한(RLS) 등을 포함한 통합 테스트를 진행합니다.
- 실제 데이터로 전환할 때는 UI 컴포넌트를 수정하지 않고 데이터 조회 부분만 교체할 수 있도록 구현합니다.

### 개발중 이슈 관련사항 (결정 X, 개선사항)

- docs/ISSUES.md 파일에 기록 합니다.

### 테스트계정(계정/비밀번호)

- chopin0625/qwer1234
- 0625chopin/qwer1234
