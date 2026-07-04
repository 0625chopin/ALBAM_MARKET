# 🧩 알밤마켓 admin / 일반 사이트 분리 계획 (DIVISION)

> 관리자(admin) 콘솔을 일반 사이트와 **완전 별도 레포**로 분리하기 위한 마스터 정리 문서.
> Supabase 백엔드만 공유하고, 프론트엔드는 저장소·배포·도메인을 물리적으로 분리한다.

**작성일: 2026-07-04 · 상태: 착수(Phase A-1 인프라)** · 실행 관리: shrimp task manager(TS01~TS21)

기반 문서: [`PRD_ADMIN.md`](./PRD_ADMIN.md) · [`ROADMAP_ADMIN.md`](./ROADMAP_ADMIN.md) · [`ROADMAP.md`](./ROADMAP.md) · [`ISSUES.md`](./ISSUES.md) · [`../CLAUDE.md`](../CLAUDE.md)

---

## 1. 배경 · 목적 · 타이밍

- **배경**: MVP(일반 사이트)는 완성·안정 상태. 관리자 콘솔은 기획(PRD_ADMIN/ROADMAP_ADMIN)만 끝나고 **코드는 아직 0**.
- **목적(사용자 확정)**: **보안 격리** · **독립 배포** · **운영 편의**.
- **분리 형태(사용자 확정)**: **완전 별도 레포**(별도 저장소·별도 배포). Supabase 백엔드만 공유.
- **타이밍(확정)**: **지금 분리**. admin이 아직 안 짜였으므로 처음부터 admin 레포에 태어나게 하면 **재작업 0**. 반대로 "일반 앱에 섞어 개발 후 분리"는 순수 재작업 + 그동안 admin 코드·service_role이 공개 배포에 실려 보안 표면 증가.

---

## 2. 현재 구조 사실 (분리 근거)

- 단일 Next.js 앱. GitHub `0625chopin/ALBAM_MARKET`(main), npm(+lock), `tsconfig` `@/*` → 저장소 루트 단일 별칭.
- Next **canary**(`next.config.ts` `cacheComponents: true`), React 19, TailwindCSS **v4**(CSS-first, `app/globals.css`의 `@theme inline` 토큰 — color/radius/**sidebar 토큰 이미 존재**), shadcn/ui(new-york), 미들웨어는 루트 `proxy.ts`.
- 특권 인프라: `lib/supabase/admin.ts`의 `createAdminClient()`(service_role, 서버 전용) — 현재 사용처는 OTP 라우트뿐.
- **공유되어야 할 표면**: `lib/{types, database.types, supabase/*, format, utils, constants, queries/_map}` + `components/{ui(17), common(9)}`.
- **admin이 실제로 갈라지는 부분은 레이아웃 셸/네비뿐** — 나머지는 "반드시 공유해야 하는" 코드.

---

## 3. 확정 아키텍처 (핵심 8쟁점 결론)

| #   | 쟁점                | 결정                                                                                                                                                                                 |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 공유 배포 메커니즘  | **private npm 패키지 `@0625chopin/shared`(GitHub Packages)**. lockfile 정확 핀 → 독립 배포 결정성·드리프트 차단. _(대안=git submodule, 발행 마찰 과다 시 전환 — TS01 ADR)_           |
| 2   | `database.types.ts` | **shared 단일 소스**. 파이프라인: 원격 `apply_migration` → `generate_typescript_types` → shared 반영 → bump/publish → 양 레포 `npm update`. 마이그레이션 소유 = **admin 레포**       |
| 3   | 인증                | **admin 자체 로그인**(별도 도메인 → 쿠키 공유 불가). 동일 Supabase Auth 백엔드, `signInWithPassword` + `admin_users` 게이트. 관리자 세션이 공개 세션과 완전 격리                     |
| 4   | admin 스캐폴딩      | **최소 신규 앱 + 설정만 복사**(복제-후-삭제 아님 → 잔재/실수 회피)                                                                                                                   |
| 5   | 공개 앱             | **소비자 전환**(브랜치에서 import 코드모드 → 원본 삭제, `check-all`+build+Playwright 그린 전 미병합)                                                                                 |
| 6   | env/배포            | `SUPABASE_SERVICE_ROLE_KEY`는 **admin에만**. Vercel 프로젝트 2개·각 도메인. `latest` 제거·3레포 정확 버전 핀                                                                         |
| 7   | Supabase 백엔드     | admin_users/reports/RLS/admin RPC는 분리 무관 공통 → 기존 ROADMAP_ADMIN TA040~TA058 재사용, 소유 = admin 레포                                                                        |
| 8   | ROADMAP 재편        | A0 앞에 **Phase A-1(분리 인프라)** 삽입. TA 재타겟: TA010(admin 레포 잔류)·TA011/TA012(admin `app/**`·`/sample`)·TA040(타입→shared)·TA057(admin `proxy.ts`에서 `admin_users` 실검증) |

### 3.1 대상 레포 3개

```
almbam-shared (@0625chopin/shared, private npm/GitHub Packages)
├─ lib/types/*, database.types.ts
├─ lib/supabase/{client,server,proxy,storage,admin}
├─ lib/{format,utils,constants}, lib/queries/_map
├─ components/ui/*(17), components/common/*(9)
└─ styles.css (Tailwind v4 @theme 토큰)          ← 단일 디자인 소스
        ▲ peerDeps: react, tailwindcss, @supabase/*
        │ 소비
   ┌────┴───────────────────────────┐
ALBAM_MARKET(공개 앱)            albam-admin(관리자 앱)
├─ app/*, components/layout/*     ├─ app/*(admin), 사이드바 셸
├─ lib/queries/*, mutations/*     ├─ 자체 /login, proxy.ts 가드
└─ Vercel: 공개 도메인            └─ Vercel: admin 도메인 · service_role env
```

### 3.2 공유 경계 인벤토리 (TS02에서 확정)

- **이동(shared)**: `lib/types/*`, `lib/database.types.ts`, `lib/supabase/{client,server,proxy,storage}.ts`, `lib/format.ts`, `lib/utils.ts`, `lib/constants/*`, `lib/queries/_map.ts`, `components/ui/*`, `components/common/*`, `app/globals.css`의 `@theme` 토큰.
- **`lib/supabase/admin.ts`**: shared에 두되 service_role 키 부재 시 throw, **공개 앱은 import하지 않음**.
- **잔류(각 앱)**: `lib/queries/*`·`lib/mutations/*`(도메인), `components/layout/*`, `app/*`. admin 전용 타입/컴포넌트는 admin 레포.

### 3.3 인증·도메인 모델 (TS03)

- 별도 도메인 → Supabase Auth 쿠키는 도메인 귀속이라 공유 불가 → **admin은 자체 `/login`**.
- 동일 Supabase Auth 백엔드에 `signInWithPassword` 후 **`admin_users` 소속 게이팅**(비관리자 세션은 admin 진입 불가). 세션 격리가 보안 목적에 부합.

---

## 4. Vercel 배포 · 서버 배포 (공유 패키지 대응)

> **핵심 오해 방지**: `@0625chopin/shared`는 **서버에 배포되는 프로젝트가 아니라**, 패키지
> 레지스트리(GitHub Packages)에 **발행되는 라이브러리**다. Vercel에 "서버 배포"되는 것은
> **두 Next.js 앱(공개 앱·admin 앱)뿐**이며, 각 앱이 **빌드 시 private 공유 패키지를 인증해
> 설치**한다. shared는 Vercel에 올리지 않는다.

### 4.1 배포 토폴로지

```
almbam-shared (GitHub repo)
  └─ GitHub Actions → npm publish → GitHub Packages(npm.pkg.github.com)
       ▲ = "라이브러리 발행" (서버 배포 아님)
       │ 빌드 시 npm install 로 인증 다운로드
   ┌───┴───────────────────────────────┐
ALBAM_MARKET(공개 앱)                 albam-admin(admin 앱)
  └▶ Vercel 프로젝트 #1 (공개 도메인)     └▶ Vercel 프로젝트 #2 (admin 도메인)
     = 서버 배포(서버리스/Edge)              = 서버 배포(서버리스/Edge)
```

- **Vercel 프로젝트는 2개**(공개·admin). shared는 Vercel 프로젝트가 아니다.
- 세 레포 모두 GitHub 저장소지만, shared만 Actions로 **발행**, 앱 2개만 Vercel과 **연결**.

### 4.2 핵심 난관 — private 패키지 인증(빌드 타임)

Vercel 빌드의 `npm install`이 private `@0625chopin/shared`를 GitHub Packages에서 받으려면 **인증**이
필요하다. 각 앱 레포 루트에 `.npmrc`(커밋 가능 — 토큰은 env로 치환):

```
@0625chopin:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

- `${NPM_TOKEN}`은 npm이 **설치 시 환경변수로 확장**한다. 토큰 문자열을 `.npmrc`에 하드코딩 금지.
- **Vercel 프로젝트 Settings → Environment Variables**에 `NPM_TOKEN` = GitHub PAT(`read:packages`)
  등록(Build 단계 노출). 로컬 개발도 동일 `.npmrc` + 셸/개인 `~/.npmrc`의 `NPM_TOKEN`.

### 4.3 Vercel 프로젝트 설정 (두 앱 공통)

| 항목             | 값                                               |
| ---------------- | ------------------------------------------------ |
| Framework Preset | Next.js(자동 감지)                               |
| Root Directory   | 레포 루트(별도 레포 → 기본값. **모노레포 아님**) |
| Install Command  | 기본 `npm install`(루트 `.npmrc` 사용)           |
| Build Command    | 기본 `next build`                                |
| Node.js Version  | 로컬과 일치(예: 20.x)                            |
| 출력             | Next.js 서버리스/Edge(자동)                      |

- `next.config.ts`에 **`transpilePackages: ['@0625chopin/shared']`** — 공유 패키지의 TS/JSX·`"use client"`를
  Next가 컴파일하도록. (미설정 시 `"use client"` 컴포넌트에서 오류 가능.)

### 4.4 환경변수 — Build vs Runtime (앱별)

Vercel env는 Build·Runtime 양쪽에 노출 가능하며 성격을 구분해야 한다.

| env                                    | 공개 앱  | admin 앱 | 성격                   | 비고                                                 |
| -------------------------------------- | -------- | -------- | ---------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | ✅       | ✅       | Build+클라이언트       | 공개                                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅       | ✅       | Build+클라이언트       | 공개                                                 |
| `NPM_TOKEN`                            | ✅       | ✅       | **Build 전용**         | private 패키지 설치용(`read:packages`)               |
| `SUPABASE_SERVICE_ROLE_KEY`            | ⚠️ OTP용 | ✅       | **Runtime(서버) 전용** | `NEXT_PUBLIC_` 금지. 격리 범위는 TS18(ADR-0002) 확정 |
| `SMTP_*` / `NOTION_API_KEY`            | 사용처   | 필요 시  | Runtime 서버 전용      | 클라이언트 미노출                                    |

> **보안 격리 실현점**: `SUPABASE_SERVICE_ROLE_KEY`·서버 시크릿은 `NEXT_PUBLIC_` 접두를 절대 쓰지
> 않는다 → 클라이언트 번들 미포함. admin의 강제/제재 특권 로직은 admin 배포에만 존재.

### 4.5 "서버 배포"의 실제 동작 (Vercel)

Next.js on Vercel은 별도 VM/컨테이너를 운영하는 게 아니라 자동으로:

- **미들웨어(`proxy.ts`)** → Vercel Edge(또는 Node) 미들웨어로 실행. admin 세션 가드가 여기서 동작.
- **Server Component / Route Handler / Server Action** → 서버리스 함수로 실행.
  `createClient(server)`·`createAdminClient()`(service_role)는 **여기서만** 동작 → 클라이언트 안전.
- **정적/`use cache`(cacheComponents)** → 프리렌더/캐시.

즉 "서버 배포"는 Vercel이 서버리스/Edge로 자동 처리하며, **직접 운영하는 서버는 없다**(백엔드 상태는
Supabase). 세 레포 중 서버로 도는 것은 공개·admin **앱 2개**뿐.

### 4.6 배포 순서 · 버전 갱신 루프 (의존성 있는 배포)

1. **최초**: ① shared 발행(`@0625chopin/shared@x`) → ② 앱 `package.json`에 의존 추가·`npm install`(lock
   갱신) → ③ Vercel env(NPM_TOKEN·Supabase 키) 설정 → ④ push → Vercel이 패키지 인증 설치 후 배포.
2. **shared 변경 시**: shared bump/publish → 각 앱 `npm update @0625chopin/shared`(lock 갱신)·커밋·push →
   Vercel 재배포. (앱은 정확 버전 핀이라 자동 수신 안 함 = **의도된 배포 결정성**.)
3. **DB 타입 변경**: 원격 `apply_migration` → 타입 재생성 → shared 반영·발행 → 양 앱 `npm update`
   (TS20 동기화 파이프라인).

> **선행 조건**: 앱 배포는 **shared가 먼저 발행**돼 있어야 성립(의존성 해석). 그래서 TS09(발행)가
> 공개앱(TS13)·admin(TS19) 배포의 공통 관문이다.

### 4.7 계정 소유자 체크리스트 (Vercel/배포)

- [ ] **GitHub PAT** 발급: `read:packages`(앱 소비/Vercel), `write:packages`(shared 발행 CI). GitHub
      Packages npm은 **클래식 PAT** 권장.
- [ ] **Vercel 프로젝트 2개** 생성(공개=기존 프로젝트 재사용 가능, admin=신규), 각 GitHub 레포 연결.
- [ ] 각 프로젝트 **env** 설정(§4.4 표): `NPM_TOKEN`, `NEXT_PUBLIC_*`, (서버) `SUPABASE_SERVICE_ROLE_KEY` 등.
- [ ] **도메인** 연결: 공개 도메인 / admin 도메인(또는 서브도메인). admin은 자체 로그인이라 쿠키 공유 불필요.
- [ ] (선택) admin 접근 이중화: Vercel Deployment Protection(비밀번호/Trusted IPs) + 미들웨어 가드.

---

## 5. Phase A-1 · 분리 인프라 태스크 (TS01~TS21)

> shrimp task manager에 의존성 순서로 등록됨(`append`). TS21 완료 후 admin 레포에서 기존 ROADMAP_ADMIN **A0~~A6(TA001~~TA064)** 기능 개발 시작.

| Task     | 그룹   | 작업                               | 의존성     | shrimp ID  |
| -------- | ------ | ---------------------------------- | ---------- | ---------- |
| **TS01** | 결정   | 공유 배포 메커니즘 ADR             | -          | `f67cf250` |
| **TS02** | 결정   | 공유 경계 인벤토리 확정            | TS01       | `601697d0` |
| **TS03** | 결정   | 도메인·인증 모델 확정              | -          | `23170681` |
| **TS04** | 결정   | 버전 핀 정책 확정                  | -          | `928fe3d5` |
| **TS05** | 공유   | shared 레포/패키지 스캐폴드        | TS01,02,04 | `ab8818e2` |
| **TS06** | 공유   | 공유 소스 이관                     | TS05       | `a12d68f9` |
| **TS07** | 공유   | Tailwind 테마 토큰 공유화          | TS06       | `8ea7350c` |
| **TS08** | 공유   | shared 빌드/타입/린트 게이트       | TS06       | `782bd036` |
| **TS09** | 공유   | GitHub Packages 발행 파이프라인    | TS08       | `6fe95e4d` |
| **TS10** | 공개앱 | 공개 앱 shared 도입                | TS09       | `aa829c98` |
| **TS11** | 공개앱 | import 코드모드 재작성             | TS10       | `96bddd28` |
| **TS12** | 공개앱 | 공개 앱 MVP 회귀 검증(롤백 포인트) | TS11       | `7e6aacea` |
| **TS13** | 공개앱 | 공개 앱 배포 반영                  | TS12       | `b4941e76` |
| **TS14** | admin  | admin 레포 생성+설정 이식          | TS04,09    | `69b927fa` |
| **TS15** | admin  | admin shared 도입+셸 골격          | TS14       | `57dbdccb` |
| **TS16** | admin  | admin 자체 인증 플로우             | TS15,03    | `ab29832f` |
| **TS17** | admin  | admin `proxy.ts` 가드 골격         | TS16       | `6ade700f` |
| **TS18** | env    | 시크릿·env 분리                    | TS14       | `3b7bf4d8` |
| **TS19** | env    | admin Vercel 프로젝트+도메인       | TS17,18    | `0685faaf` |
| **TS20** | 동기화 | database.types 동기화 파이프라인   | TS09       | `94321f23` |
| **TS21** | 접합   | 경계 문서화 & ROADMAP_ADMIN 재편   | TS13,19,20 | `77aba26a` |

### 크리티컬 패스

`TS01 → TS02 → TS05 → TS06 → TS08 → TS09 → TS10 → TS11 → TS12 → TS13 → TS21`
(TS09가 공개앱·admin 양쪽의 공통 관문. TS03/TS04는 조기 병행 가능.)

### 계정 소유자 개입이 필요한 태스크 (Claude 권한 밖)

- **TS05/TS14**: GitHub 레포 2개 신규 생성 · **TS09**: GitHub Packages 발행(토큰) · **TS13/TS19**: Vercel 프로젝트·도메인 연결 · **TS18**: service_role/토큰 env 주입.
- → 해당 지점에서 필요한 계정 작업을 안내하고, 코드/구성 산출물은 Claude가 준비한다.

---

## 6. 경계 · 핸드오프

- **TS21까지 = 분리 인프라(A-1).** 이후 **TA001(A0 권한 모델)~TA064**는 admin 레포에서 진행.
- 공통 base 타입/db 타입 = `@0625chopin/shared`. admin 전용 타입 = admin 레포.

## 7. 리스크 · 롤백

- **MVP 무중단**: TS10~TS13은 공개 레포 브랜치 한정, 그린 전 미병합 → 롤백 = 브랜치 폐기.
- **타입 드리프트**: db 타입 단일 소스(shared) + lockfile 정확 핀 + shared CI `gen types` diff 감시.
- **버전 스큐**: `latest` 제거, 3레포 정확 canary/React/Tailwind 핀.
- **테마 드리프트**: 토큰을 shared `styles.css` 단일 소스로, 두 앱 `@import`.
- **service_role 유출**: TS18 grep 게이트 + admin에만 존재 + `admin.ts` 키 부재 시 throw.
- **발행 마찰 과다 시**: TS01 ADR의 submodule 대안으로 전환.

## 8. 검증

- **shared**: `build`+`tsc --noEmit` 통과, `.d.ts`·`"use client"` 보존, `@0625chopin/shared@0.1.0` 발행.
- **공개 앱**: `npm run check-all`+`next build`+Playwright 스모크 그린(MVP 무영향).
- **admin**: `next build`, `/login` 동작, 미인증 리다이렉트(Playwright), service_role은 admin 배포에만 존재(grep).
- **Supabase 백엔드**: 기존 방식(Supabase MCP 롤백 테스트) — A4~A5(TA) 단계.

## 9. 실행 순서

1. shrimp `execute_task`로 **TS01 → TS02 → TS03/TS04**(결정·문서) 먼저.
2. `almbam-shared` 구축(TS05~TS09) — 레포/발행은 계정 작업 안내.
3. 공개 앱 소비자 전환(TS10~TS13, 브랜치·롤백 포인트).
4. admin 레포 스캐폴드·인증·가드(TS14~~TS17), env/배포(TS18~~TS19).
5. 동기화 파이프라인(TS20) → ROADMAP_ADMIN 재편(TS21).
6. 이후 admin 레포에서 ROADMAP_ADMIN A0~~A6(TA001~~) 기능 개발.
