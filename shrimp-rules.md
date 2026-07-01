# Development Guidelines (shrimp-rules.md)

> 본 문서는 **AI 코딩 에이전트 전용 운영 규칙**이다. 일반 개발 지식은 포함하지 않는다.
> 충돌 시 우선순위: `CLAUDE.md` > 본 문서 > `docs/guides/*`.

## 프로젝트 개요

- 프로젝트: **알밤마켓** — C2C 온라인 경매 + 직거래 플랫폼 (Next.js App Router + Supabase 인증 스타터킷 확장).
- 현재 상태: **스타터킷 + 기획 문서만 존재**. 도메인 코드(`app/auctions`, `lib/types` 등)는 아직 없음.
- 기획 문서 정본: `docs/requirements/REQUIREMENTS.md`, `docs/PRD.md`, `docs/ROADMAP.md`, `docs/ISSUES.md`.
- 개발 순서: **반드시 `docs/ROADMAP.md`의 Phase/Task 순서를 따른다** (Mock First 9단계).

## 프로젝트 아키텍처 (실제 구조)

- `src/` **없음**. 루트에 `app/`, `components/`, `lib/` 배치.
- 경로 별칭: `@/*` → 루트. 예) `@/components/ui/button`, `@/lib/supabase/server`.
- 디렉터리 역할:
  - `app/` — 라우트(페이지/레이아웃/Route Handler). 인증 라우트는 `app/auth/*`, 보호 영역은 `app/protected/*`.
  - `components/` — 도메인 컴포넌트. `components/ui/` — shadcn/ui 생성물.
  - `lib/supabase/` — 컨텍스트별 클라이언트 3종. `lib/utils.ts` — `cn()`, `hasEnvVars`.
- 미들웨어는 `middleware.ts`가 **아니라** 루트 `proxy.ts` (canary 컨벤션). `proxy.ts`는 `lib/supabase/proxy.ts`의 `updateSession`만 호출.

## 신규 도메인 코드 배치 규칙 (ROADMAP 기준)

- 도메인 타입: `lib/types/*` 에 정의. **Mock과 실제 DB가 공유하는 단일 타입**으로 작성.
- Mock 데이터: `lib/mocks/*` 에 정의. `lib/types/*` 타입을 import 해 작성.
- 라우트(예시): 홈 `app/(home)/page.tsx`, 상세 `app/auctions/[id]/page.tsx`, 등록 `app/auctions/new/page.tsx`, 거래 `app/transactions/page.tsx`, 채팅 `app/chat/[roomId]/page.tsx`, 프로필 `app/profile/[id]/page.tsx`.
- 모든 신규 표현 컴포넌트는 **반드시 `app/sample/page.tsx`(전시장)에 추가**한다.
- Supabase 생성 타입: `lib/database.types.ts` (스키마 작업 후 `mcp__supabase__generate_typescript_types`로 생성).

## 코드 표준

- 주석/문서/커밋 메시지: **한국어**. 변수명/함수명: 영어.
- 컴포넌트 파일: kebab-case (예: `auction-card.tsx`). 기존 `components/*.tsx` 네이밍을 따른다.
- 스타일: **TailwindCSS v3.4.1** 사용 (`tailwind.config.ts` + `postcss.config.mjs`). **v4 문법/설정 금지.**
- 색상: 하드코딩 금지. 시맨틱 변수(`bg-background`, `text-muted-foreground` 등) 사용.
- className 병합은 `cn()` (`@/lib/utils`) 사용.
- shadcn/ui 추가: `mcp__shadcn__*` 도구 사용, `components.json`(new-york, lucide) 설정 준수. 결과물은 `components/ui/`.

## 기능 구현 표준

### Supabase 클라이언트 — 컨텍스트별 분리 (위반 시 세션 손상)

- 브라우저(Client Component): `@/lib/supabase/client` 의 `createClient()`.
- Server Component / Server Action / Route Handler: `@/lib/supabase/server` 의 `await createClient()`.
- 미들웨어: `@/lib/supabase/proxy` 의 `updateSession()`.
- **금지**: 전역 변수에 클라이언트 캐싱. 매 호출마다 새로 생성 (Fluid compute 대응).

### `lib/supabase/proxy.ts` 세션 버그 방지 (위반 시 무작위 로그아웃)

- `createServerClient`와 `supabase.auth.getClaims()` 사이에 **어떤 코드도 삽입 금지**.
- `getClaims()` 호출 **제거 금지**.
- `supabaseResponse`를 그대로 반환. 새 응답 생성 시 **쿠키 반드시 복사**.

### 폼 처리

- 폼은 **Client Component + `useState` + Supabase 클라이언트 직접 호출** (`signInWithPassword` 등). 기존 `components/login-form.tsx` 패턴을 따른다.
- **금지**: React Hook Form, Zod, Server Actions 도입 (미설치 — `docs/guides/forms-react-hook-form.md`는 미적용 가이드).

### 화면 우선 개발 (Mock First) — 강제

- DB 작업(ROADMAP Phase 4) **전에** Mock 데이터로 화면을 먼저 완성한다.
- 표현 컴포넌트는 데이터를 **props로만** 받는다. 조회 로직을 컴포넌트 내부에 넣지 않는다.
- 실데이터 전환 시 **UI 컴포넌트 수정 금지**, 데이터 조회부만 Mock → Supabase로 교체.

## 환경 변수

- `.env.local` 사용. 필수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- 변수 존재 검사는 `lib/utils.ts`의 `hasEnvVars` 사용.

## 워크플로우 표준

- 작업 단위: `docs/ROADMAP.md`의 Task(T0xx). 작업 착수 전 해당 Task의 의존성/리스크(ISSUE) 확인.
- 작업 완료 시:
  1. `npm run check-all` (lint + format:check + typecheck) 통과 확인.
  2. 화면 작업은 Playwright MCP로 `/sample` 검증, 데이터 작업은 Supabase MCP로 검증.
  3. `docs/ROADMAP.md`의 해당 Task를 `- [x]` / ✅ 로 갱신.
- 커밋 시 Husky pre-commit(`lint-staged` → `tsc --noEmit`)이 자동 실행됨. **`--no-verify` 금지.**
- Supabase 스키마/마이그레이션 작업: `mcp__supabase__list_tables` 확인 → `mcp__supabase__apply_migration` 적용 → 타입 재생성. project ref는 `.mcp.json`(`zmeyfvfkqnemnzafpzmn`).

## 핵심 파일 동시 수정 규칙 (multi-file coordination)

- **기능 범위/요구사항 변경 시**: `docs/requirements/REQUIREMENTS.md` + `docs/PRD.md` + `docs/ROADMAP.md`를 **함께** 갱신 (기능 ID Fxxx ↔ Task Txxx ↔ 페이지 정합 유지).
- **미결정/개선 사항 발견 시**: `docs/ISSUES.md`에 ISSUE 항목 추가. 관련 ROADMAP Task의 리스크 열에 해당 ISSUE 연결.
- **상수를 추후 DB로 이관할 항목**: `docs/ISSUES.md`에 등록 (예: 36시간 낙찰시간 = ISSUE-001).
- **데이터 모델 변경 시**: `docs/PRD.md`(데이터 모델) + `lib/types/*` + (DB 단계라면) 마이그레이션 + `lib/database.types.ts`를 함께 갱신.
- **shadcn/ui 컴포넌트 추가 시**: `components/ui/`에 생성 + `app/sample/page.tsx`에 전시 추가.

## AI 의사결정 기준

- 가이드 문서(`docs/guides/*`)와 실제 코드가 충돌하면 → **실제 코드 + `CLAUDE.md`** 를 따른다 (예: Tailwind v3.4.1, `src/` 없음, RHF/Zod 미사용).
- 폼 구현 방식 판단 → 항상 `useState` + Supabase 직접 호출. (RHF/Zod 선택 금지)
- 미들웨어/세션 코드 수정 요청 → `lib/supabase/proxy.ts` 세션 버그 방지 규칙을 최우선 적용.
- 미결정 정책(ISSUE-002~008 등)이 걸린 구현 → 임시 상수/최소 동작으로 진행하고 `docs/ISSUES.md`에 명시. 사용자 임의 결정 금지.
- 개발 순서가 모호하면 → `docs/ROADMAP.md`의 가장 낮은 미완료 Phase/Task부터 진행.

## 금지 사항 (Prohibited)

- ❌ TailwindCSS v4 문법/설정 사용.
- ❌ React Hook Form / Zod / Server Actions 도입.
- ❌ Supabase 클라이언트를 전역 캐싱하거나, 컨텍스트에 맞지 않는 클라이언트 사용.
- ❌ `lib/supabase/proxy.ts`에서 `createServerClient`~`getClaims()` 사이 코드 삽입 또는 `getClaims()` 제거.
- ❌ `middleware.ts` 생성 (이 프로젝트는 루트 `proxy.ts` 사용).
- ❌ `src/` 디렉터리 생성.
- ❌ DB 설계를 화면(Mock) 완성보다 먼저 진행 (ROADMAP Phase 역전).
- ❌ 실데이터 전환 시 UI 컴포넌트 구조 변경.
- ❌ 색상/스타일 하드코딩 (시맨틱 변수 미사용).
- ❌ 신규 표현 컴포넌트를 `/sample` 미등록.
- ❌ 커밋 시 `--no-verify`로 훅 우회.
- ❌ 기획 문서(REQUIREMENTS/PRD/ROADMAP/ISSUES) 간 정합성을 깨는 단독 수정.
