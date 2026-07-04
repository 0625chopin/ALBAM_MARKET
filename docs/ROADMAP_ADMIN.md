# 🛡️ 알밤마켓 관리자(Admin) 콘솔 개발 로드맵 (ROADMAP_ADMIN)

> 회원·상품·거래·신고를 모니터링하고, 제재/강제 조치로 어뷰징·분쟁에 대응하며, 정책 수치를 운영 중 조정하는 **운영자 콘솔**.

**상태: 착수 전(계획)** · 작성일: 2026-07-04 · 완료 0 / 전 Task 대기(`- [ ]`)

> **🔀 분리 방침 확정 (2026-07-04)**: 관리자 콘솔은 일반 사이트와 **분리된 별도 앱/배포**로 구축한다. 목적: 보안 격리·독립 배포·운영 편의. 따라서 본 로드맵의 "같은 앱 `app/admin/**` 라우트 그룹" 전제는 **별도 앱(예: `apps/admin`) 전제로 대체**되며, 아래 사항이 추가된다:
>
> - **신규 선행 Phase A-1 · 저장소/앱 분리 셋업**(Phase A0보다 먼저): 분리 구조 구성 + 공유층 배치 + admin 앱 스캐폴딩 + env(`SUPABASE_SERVICE_ROLE_KEY`는 admin 앱에만)·도메인 설정.
> - Phase A0/A5의 미들웨어 가드는 루트 `proxy.ts` 확장이 아니라 **admin 앱 자체 `proxy.ts`**로 구현.
> - Supabase 백엔드(`admin_users`/`reports`/RLS/admin RPC, Phase A4~A5)는 **분리와 무관하게 공유** — 기존 Task 유지.
> - **OPEN-A(분리 형태)**: 모노레포 2앱(`packages/shared`, 권장) vs 완전 별도 레포(submodule/private 패키지) — **착수 전 확정 필요**. A-1의 구체 작업과 공유층 배치 방식이 이 선택에 종속되므로, 확정 후 A-1 상세와 A0/A1 문구를 갱신한다.

본 로드맵은 다음 문서를 기반으로 작성되었습니다.

- **기능/데이터 모델/우선순위(핵심 근거)**: [`PRD_ADMIN.md`](./PRD_ADMIN.md) (FA001~~FA090, 티어 1/2/3차 = MoSCoW Must/Should/Could, 신규 테이블, admin RPC 후보, 3중 가드, OPEN-1~~6)
- **문서 포맷 원본 / MVP 현황**: [`ROADMAP.md`](./ROADMAP.md) (T001~~T077, Phase 0~~6 완료, Phase 7 T073/T074가 본 콘솔의 상위 항목)
- **사용자 기능 PRD / 확정 정책**: [`PRD.md`](./PRD.md), [`ISSUES.md`](./ISSUES.md) (ISSUE-002/003/004/007/008/019 등)
- **아키텍처/개발 원칙 (최우선 기준)**: [`../CLAUDE.md`](../CLAUDE.md)

> **태스크 넘버링**: 메인 `ROADMAP.md`가 T001~T077을 사용하므로, 충돌 방지를 위해 관리자 태스크는 **`TA001`부터**(TA = Task Admin), 마일스톤은 **`AM1/AM2/AM3`**로 구분합니다.

---

## 📌 핵심 개발 원칙 (반드시 준수)

관리자 콘솔도 프로젝트 표준 개발 원칙(Mock First)을 그대로 따릅니다 (PRD_ADMIN "🚦 개발 원칙").

1. **화면 우선 개발 (Mock First)**: DB/권한 연결 **전에** Mock 데이터 + 공용 타입(`lib/types/admin*`)으로 관리자 화면을 먼저 완성합니다.
2. **단일 타입 계약**: 관리자용 신규 타입도 Mock·실DB가 **동일 계약**을 공유. 실데이터 전환 시 **UI 무수정, 조회부만 교체**.
3. **`/sample/admin` 전시장**: 관리자 컴포넌트도 `/sample/admin`에 전시(Loading/Empty/Error 3상태 포함). 권한 게이트 뒤 실제 화면은 `/admin/**`.
4. **snake↔camel 매핑**: 신규 테이블도 `lib/queries/_map.ts` 패턴으로 매핑(ISSUE-012).
5. **스키마 변경 절차**: 원격 Supabase(`zmeyfvfkqnemnzafpzmn`)에 `apply_migration` 후 `generate_typescript_types`로 `lib/database.types.ts` 재생성(로컬 SQL 파일 없음).
6. **감사 로그 필수**: 모든 관리자 조치는 `admin_action_logs`에 기록(누가·언제·무엇을·왜) — FA002.
7. **품질 검증**: 테스트 러너 없음. `npm run check-all`(lint + format:check + typecheck), **Playwright MCP**(가드/화면), **Supabase MCP**(RLS/RPC/advisor)로 검증.

## 🛠️ 기술 스택 (실제 레포 기준)

| 영역          | 스택                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| 프레임워크    | Next.js App Router (latest/canary, `cacheComponents`), 미들웨어는 루트 `proxy.ts`                                |
| UI            | React 19, TypeScript, TailwindCSS v4(CSS-first), shadcn/ui(new-york), Lucide, next-themes                        |
| 관리자 특권   | `lib/supabase/admin.ts`의 `createAdminClient()`(service_role, RLS 우회, **서버 전용**) — 강제/제재 mutation 한정 |
| 백엔드        | Supabase `@supabase/ssr` — Auth / PostgreSQL / Storage / Realtime, admin RPC(plpgsql, SECURITY DEFINER)          |
| 차트/대시보드 | shadcn/ui 기반 표현 컴포넌트(순수 props), KPI 카드·추이 차트·운영 위젯                                           |

---

## 🔁 개발 워크플로우

1. **작업 계획**: MVP 코드베이스 현재 상태(Phase 0~6 완료) 파악 후 본 로드맵에 작업 반영. 우선순위(⭐)는 각 Phase 선두에 배치.
2. **작업 구현**: 단계별 구현. 화면 작업은 `/sample/admin`에서 Playwright MCP 검증, 데이터/권한 작업은 Supabase MCP(RLS/RPC/advisor) 검증.
3. **품질 검사**: 각 작업 종료 시 `npm run check-all` 통과 확인(커밋 시 Husky pre-commit이 lint-staged → tsc 자동 실행).
4. **로드맵 업데이트**: 완료 작업을 `- [x]` 및 ✅로 표시(`/docs:update-roadmap` 스킬 활용).

### 상태 범례

- `- [ ]` 대기 / `- [x]` 완료 · **🟢 진행중** · **⭐ 우선순위** · **✅ 완료**
- 우선순위 티어: **`1차`(Must)** · **`2차`(Should)** · **`3차(선택)`(Could)** — PRD_ADMIN 우선순위 티어 반영
- 의존성·OPEN: 🔴 OPEN(미결정, 착수 전 사용자 확정 필요) 이슈가 걸린 작업은 **리스크**로 표기

---

# 🧱 Phase A-1 · 저장소/앱 분리 셋업 (분리 인프라)

> **완전 별도 레포 분리**(공유 패키지 `@0625chopin/shared` + 공개앱 + admin앱). shrimp 태스크 **TS01~TS21**.
> 상세 계획·배포는 [`division.md`](./division.md), 결정은 [`adr/0001~0004`](./adr/). **A-1 완료 후 A0(TA001~)부터
> admin 레포에서 기능 개발 시작.**

| Task | 상태         | 작업                               | 산출물/비고                                          |
| ---- | ------------ | ---------------------------------- | ---------------------------------------------------- |
| TS01 | ✅           | 공유 배포 메커니즘 ADR             | `adr/0001` — @0625chopin/shared npm(GitHub Packages) |
| TS02 | ✅           | 공유 경계 인벤토리                 | `adr/0002` — 이동 45파일 + service_role 발견         |
| TS03 | ✅           | 도메인·인증 모델                   | `adr/0003` — admin 자체 로그인+admin_users 게이팅    |
| TS04 | ✅           | 버전 핀 정책                       | `adr/0004` — next 16.2.9 등 3레포 정합               |
| TS05 | ✅           | shared 레포/패키지 스캐폴드        | `almbam-shared/` (빌드 검증)                         |
| TS06 | ✅           | 공유 소스 이관 (45파일)            | src 이관 + import 재배선, tsc 통과                   |
| TS07 | ✅           | Tailwind 테마 토큰 공유화          | `src/styles.css` 디자인 토큰                         |
| TS08 | ✅           | 빌드/타입/린트 게이트              | check-all 통과, .d.ts, use client 보존               |
| TS09 | ✅ / ⏳ 발행 | GitHub Packages 발행 파이프라인    | `publish.yml`+`PUBLISHING.md` (발행=계정)            |
| TS10 | ✅           | 공개앱 shared 도입                 | 브랜치 `chore/extract-shared`, transpilePackages     |
| TS11 | ✅           | import 코드모드 재작성 + 원본 삭제 | 잔여 참조 0, tsc/build 통과                          |
| TS12 | ✅           | 공개앱 MVP 회귀 검증               | check-all + next build 그린 (main 미병합)            |
| TS13 | ✅ / ⏳ 배포 | 공개앱 배포 반영                   | 버전 핀 완료, Vercel/병합=계정                       |
| TS14 | ✅           | admin 레포 생성+설정 이식          | `albam-admin/` next build 통과                       |
| TS15 | ✅           | admin shared 도입 + 셸 골격        | 사이드바(9메뉴)+대시보드+/sample                     |
| TS16 | ✅           | admin 자체 인증 (로그인/로그아웃)  | `(auth)/login` signInWithPassword                    |
| TS17 | ✅           | admin proxy.ts 가드 골격           | 미인증→/login, admin_users는 TA057                   |
| TS18 | ✅           | 시크릿·env 분리                    | 양앱 .env.example (service_role 용도 분리)           |
| TS19 | ✅ / ⏳ 배포 | admin Vercel 프로젝트+도메인       | `DEPLOY.md` (프로젝트 생성=계정)                     |
| TS20 | ✅           | database.types 동기화 파이프라인   | `SYNCING.md`+`db-types-drift.yml`                    |
| TS21 | ✅           | 경계 문서화 & ROADMAP_ADMIN 재편   | 본 섹션                                              |

> ⏳ = 엔지니어링분 완료, 계정 소유자 1회 작업(GitHub 레포 push·발행, Vercel 프로젝트·도메인) 대기.

### 🔗 기존 TA 태스크 접합 (A-1 → A0~A6)

분리로 인해 기존 TA(같은 앱 `app/admin/**` 전제)를 아래와 같이 **admin 레포 기준**으로 재해석한다.

| 기존 TA         | 재해석                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------- |
| **TA010**       | 관리자 전용 타입은 **admin 레포 잔류**(공유 base/db 타입만 `@0625chopin/shared`)             |
| **TA011/TA012** | 라우트/레이아웃은 admin 레포 **`app/**` 루트**(TS15 셸 위에 구축), 전시장은 admin `/sample`  |
| **TA040**       | DB 스키마 변경 후 타입 재생성 산출물은 **`@0625chopin/shared/src/database.ts`에 반영**(TS20) |
| **TA057**       | 미들웨어 가드는 admin 앱 **자체 `proxy.ts`**(TS17 골격)에 **`admin_users` 실검증** 추가      |

> **경계선**: **TS01~TS21 = 분리 인프라(A-1, 완료).** 이후 **TA001(A0 권한 모델)~TA064 = 기능 개발**은
> 모두 **admin 레포**에서 진행한다. 공통 타입/UI/Supabase 클라이언트는 `@0625chopin/shared` 소비.

---

# 🔐 Phase A0 · 권한 모델 선행 (모든 Phase의 전제)

> **모든 관리자 기능(FA010~FA090)의 전제.** `admin_users` 기반 3중 가드가 완료되어야 나머지 기능을 안전하게 노출할 수 있다. (PRD_ADMIN "🔐 선행 과제")

| Task  | 상태  | 작업                                           | 의존성 | 관련 기능    | 리스크(OPEN)      |
| ----- | ----- | ---------------------------------------------- | ------ | ------------ | ----------------- |
| TA001 | - [ ] | 관리자 권한 모델 설계·부트스트랩 ⭐ - 우선순위 | -      | FA001        | 🔴 OPEN-3, OPEN-5 |
| TA002 | - [ ] | 3중 가드(미들웨어/RLS/RPC) 개념·계약 확정      | TA001  | FA001, FA002 | 🔴 OPEN-3         |

> 📌 A0는 **개념·계약·부트스트랩 설계** 단계다. 실제 스키마 마이그레이션은 Phase A4(TA040), 미들웨어 실연결은 Phase A5(TA057)에서 수행한다(Mock First 순서 유지).

- **TA001 세부 — 관리자 판별 방식(1차 선행)** (PRD_ADMIN "결정된 권한 판별 방식")
  - [ ] 관리자 판별을 **별도 `admin_users` 테이블**로 확정(`profiles`에 `role`/`is_admin` 컬럼 **추가하지 않음**)
  - [ ] `admin_users` 개념 컬럼 확정: `user_id`(PK, → `profiles.id`) · `role`(text 기본 `admin`, 다단계 확장 여지 🔴 OPEN-5) · `granted_by`(→ `profiles.id`, nullable) · `granted_at`(timestamptz)
  - [ ] **최초 관리자 부트스트랩** 절차 문서화: Supabase MCP `execute_sql`로 대상 `profiles.id`를 `admin_users`에 직접 INSERT(`granted_by=NULL`, `role='admin'`). 이후는 FA023(관리자 지정)로 관리
  - [ ] 테스트 계정(chopin0625/0625chopin) 중 1명을 부트스트랩 관리자로 지정하는 시나리오 정의
  - [ ] `createAdminClient()`(service_role) 재사용 범위 확정 — 강제/제재 mutation 한정, **클라이언트 번들 노출 절대 금지**
- **TA002 세부 — 3중 가드 계약(1차 선행)** (PRD_ADMIN "접근 통제 계층")
  - [ ] **미들웨어 가드**(루트 `proxy.ts`) 계약: 세션 유무 + `admin_users` 소속 여부 판정, 비관리자는 홈(또는 404) 리다이렉트. `createServerClient`~`getClaims` 사이 코드 삽입 금지·`supabaseResponse` 반환 규칙(CLAUDE.md) 준수
  - [ ] **RLS 정책** 계약: `is_admin()` SQL 헬퍼(`auth.uid()` in `admin_users`) 설계, 관리자 전용 테이블은 관리자만 조회/수정
  - [ ] **RPC 권한 검증** 계약: 모든 admin RPC 내부에서 `admin_users` 확인 후 실행, 위반 시 예외 → **① 권한검증 → ② 상태전이 → ③ 감사로그 적재**를 단일 트랜잭션으로 (FA002)
  - [ ] 참고 라우트 모델(`app/my-products/page.tsx` 로그인 게이트) 위에 **관리자 게이트**를 얹는 구조 확정

---

# 🎨 Phase A1 · 관리자 타입 & 라우트 골격

> 데이터 계약(관리자 신규 엔티티 타입)을 먼저 고정하고 `/admin/**` 라우트 이동 흐름을 검증. 모든 관리자 화면 작업의 토대.

| Task  | 상태  | 작업                                                     | 의존성 | 관련 기능      | 리스크(OPEN) |
| ----- | ----- | -------------------------------------------------------- | ------ | -------------- | ------------ |
| TA010 | - [ ] | 관리자 공용 타입 정의 (`lib/types/admin*`) ⭐ - 우선순위 | TA001  | 전 기능/데이터 | 🔴 OPEN-4    |
| TA011 | - [ ] | `/admin/**` 라우트 골격(빈 페이지) 스캐폴딩              | TA010  | FA010~FA090    | -            |
| TA012 | - [ ] | 관리자 레이아웃 + 사이드바 네비 + 관리자 게이트 골격     | TA011  | FA001          | -            |

- **TA010 세부 — 단일 타입 계약(camelCase, PRD_ADMIN "🗄️ 데이터 모델" 1:1 매핑)**
  - [ ] `AdminUser`(userId/role/grantedBy/grantedAt) — FA001/FA023
  - [ ] `Report`(id/reporterId/targetType(`product`/`user`/`message`/`rating`)/targetId/reason/detail/status(`pending`/`reviewing`/`resolved`/`rejected`)/handledBy/resolution/createdAt/handledAt) — FA050~FA052
  - [ ] `AdminActionLog`(id/adminId/actionType(`suspend_user`/`force_withdraw`/`force_cancel_tx`/`grant_penalty`/`update_policy` 등)/targetType/targetId/reason/meta(jsonb)/createdAt) — FA002
  - [ ] `UserSuspension`(id/userId/reason/suspendedBy/startsAt/endsAt(영구는 NULL)/liftedAt) — FA022 (구현방식 🔴 OPEN-4)
  - [ ] 블라인드 플래그 타입 확장: `Product.isBlinded`·`Message.isBlinded`·`Rating.isBlinded`(기본 false) — FA031/FA070/FA080
  - [ ] 대시보드 파생 타입: `DashboardKpi`(총회원/진행중경매/오늘신규(가입·경매·입찰·거래)/거래완료율/미처리신고/제재중회원) · `TrendPoint`(일별 추이) · `SystemStatus`(cron 잡·Storage) — FA010~FA013
- **TA011 세부 — 라우트 골격**(PRD_ADMIN "📱 메뉴 구조", placeholder + async params await)
  - [ ] 1차: `app/admin/page.tsx`(대시보드) · `app/admin/users/page.tsx`·`app/admin/users/[id]/page.tsx` · `app/admin/products/page.tsx`·`app/admin/products/[id]/page.tsx` · `app/admin/transactions/page.tsx`·`app/admin/transactions/[id]/page.tsx`
  - [ ] 2차: `app/admin/reports/page.tsx` · `app/admin/settings/page.tsx`
  - [ ] 3차(선택): `app/admin/chat/page.tsx`(FA070) · `app/admin/ratings/page.tsx`(FA080) · `app/admin/analytics/page.tsx`(FA090)
  - [ ] `next build` 통과 확인(동적 라우트 Partial Prerender 처리)
- **TA012 세부 — 관리자 게이트 레이아웃**
  - [ ] `app/admin/layout.tsx`: 관리자 게이트(Mock 단계는 임시 통과 플래그) + 사이드바 네비(📊 대시보드/👥 회원/📦 상품·경매/💳 거래/🚨 신고·제재/⚙️ 운영설정 + 선택 3종)
  - [ ] `/admin` 진입 시 메뉴 간 네비게이션 이동 흐름 Playwright 검증
  - [ ] 시맨틱 색상 변수/`cn()`/다크모드 정합 점검

---

# 🖼️ Phase A2 · Mock UI 구현 (더미 데이터 + `/sample/admin` 전시)

> A1 타입에 맞춘 Mock 데이터로 순수 표현 컴포넌트를 만들고 모두 `/sample/admin`에 전시. **DB 없이 관리자 화면부터 완성.** 1차 기능 먼저, 2·3차는 후반 Task.

| Task  | 상태  | 작업                                        | 의존성 | 관련 기능           | 리스크(OPEN) |
| ----- | ----- | ------------------------------------------- | ------ | ------------------- | ------------ |
| TA020 | - [ ] | 관리자 Mock 데이터셋 + 공용 UI/포맷 유틸 ⭐ | TA010  | 전 기능             | -            |
| TA021 | - [ ] | 대시보드 화면 (KPI·추이·위젯·시스템상태)    | TA020  | FA010~FA013         | -            |
| TA022 | - [ ] | 회원 관리 화면 (목록·상세·이력)             | TA020  | FA020, FA021        | -            |
| TA023 | - [ ] | 상품/경매 관리 화면 (목록·필터·상세)        | TA020  | FA030, FA031        | -            |
| TA024 | - [ ] | 거래 관리 화면 (목록·필터·분쟁 상세)        | TA020  | FA040, FA041        | -            |
| TA025 | - [ ] | 신고/제재 화면 (처리 큐·제재 이력) `2차`    | TA020  | FA050~FA052         | 🔴 OPEN-1    |
| TA026 | - [ ] | 운영 설정 화면 (공통코드·정책 수치) `2차`   | TA020  | FA060, FA061        | -            |
| TA027 | - [ ] | 선택 화면 (채팅/평점/심화통계) `3차(선택)`  | TA020  | FA070, FA080, FA090 | 🔴 OPEN-6    |

- **TA020 세부**
  - [ ] `lib/mocks/admin/*` — 관리자 신규 엔티티(admin_users/reports/admin_action_logs/user_suspensions) + 대시보드 집계 더미(KPI/추이/위젯) 파생, barrel
  - [ ] shadcn/ui 확충(table/chart/card/badge/dialog 등) + 관리자 공통 컴포넌트 `components/admin/*`(순수 props): `AdminTable`·`KpiCard`·`TrendChart`·`OpsWidget`·`SystemStatusCard`·`AdminActionDialog`
  - [ ] 관리자용 포맷 유틸(집계 수치/비율/상대시각) 추가 — 기존 `lib/format.ts` 재사용
- **TA021 세부 — 대시보드(FA010~FA013)** (PRD_ADMIN "📊 대시보드 상세")
  - [ ] KPI 카드 6종+(총회원/진행중경매/오늘신규/거래완료율/미처리신고/제재중회원), 위젯 클릭 시 해당 목록 이동 링크 — FA010 `1차`
  - [ ] 추이 차트(일별 가입·경매·거래, 카테고리별 분포, GMV) + 기간 토글 — FA011 `1차`
  - [ ] 운영 위젯(마감임박 경매·자동완료 대기 거래·최근 신고·최근 가입) — FA012 `1차`
  - [ ] 시스템 상태 카드(pg_cron 잡 close/auto-complete 최근 실행·Storage 개요) — FA013 `2차`
- **TA022 세부 — 회원 관리(FA020~FA025)**
  - [ ] 회원 검색/목록: 닉네임·id·지역·레벨·정지상태 필터 — FA020 `1차`
  - [ ] 회원 상세·이력: 레벨·평점·거래/입찰/패널티/신고 이력 종합 — FA021 `1차`
  - [ ] 상세 내 조치 버튼 UI(정지/해제·패널티 부여/해제·관리자 지정·닉네임 강제변경) — FA022`1차`/FA024`1차`/FA023`2차`/FA025`2차` (인터랙션은 A3)
- **TA023 세부 — 상품/경매 관리(FA030~FA032)**
  - [ ] 목록·필터·정렬: 상태(ProductStatus)·카테고리·판매자·신고수, **신고 많은 상품 우선 정렬** — FA030 `1차`
  - [ ] 상세 + 조치 버튼(강제 내림/블라인드) — FA031 `1차`, 경매 강제 종료 — FA032 `2차`
- **TA024 세부 — 거래 관리(FA040~FA042)**
  - [ ] 목록·필터: 상태(TransactionStatus)·당사자·기간 — FA040 `1차`
  - [ ] 분쟁 상세 + 조치(강제 취소/완료) — FA041 `1차`, 자동완료(24h)·연쇄 이양 추적 뷰 — FA042 `2차`
- **TA025 세부 — 신고/제재(FA050~FA052) `2차`** 🔴 OPEN-1(신고 시스템 최종 범위)
  - [ ] 사용자 측 신고 UI(상품/사용자/메시지/평점 대상, 사유 선택+상세) — FA050
  - [ ] 신고 처리 큐(대상유형·사유·상태, 제재·삭제·반려) — FA051
  - [ ] 제재 이력(신고→제재 연결, 회원별 누적) — FA052
- **TA026 세부 — 운영 설정(FA060, FA061) `2차`**
  - [ ] 공통코드 CRUD(`code_groups`/`codes` 카테고리/지역/등급/진행시간 옵션) — FA060
  - [ ] 정책 수치 조정 UI(`codes.policy` 증가폭·자동완료·패널티 임계) + **범위 검증 표시** — FA061
- **TA027 세부 — 선택 화면 `3차(선택)`**
  - [ ] 채팅 모니터링(신고 채팅방/메시지 조회·블라인드) — FA070 🔴 OPEN-6(개인정보 열람 정책)
  - [ ] 악성 평점 처리(삭제/코멘트 블라인드) — FA080
  - [ ] 기간별 심화 통계·CSV 내보내기 — FA090

---

# 🔀 Phase A3 · 상태 화면 & 조치 인터랙션 → 마일스톤 AM1

> Loading/Empty/Error 3상태와 조치 확인 다이얼로그 인터랙션 완성. **여기까지가 "관리자 화면 완성" 마일스톤.**

| Task  | 상태  | 작업                                           | 의존성       | 관련 기능               | 리스크(OPEN) |
| ----- | ----- | ---------------------------------------------- | ------------ | ----------------------- | ------------ |
| TA030 | - [ ] | 전 관리자 화면 Loading/Empty/Error 3상태 ⭐    | TA021~TA026  | FA010~FA061             | -            |
| TA031 | - [ ] | 조치 확인 다이얼로그 인터랙션 (사유 필수 입력) | TA022~TA024  | FA022/FA024/FA031/FA041 | 🔴 OPEN-2    |
| TA032 | - [ ] | 신고 처리·정책 수정 인터랙션 `2차`             | TA025, TA026 | FA051, FA061            | 🔴 OPEN-1    |
| TA033 | - [ ] | 반응형·다크모드·접근성 + Playwright 화면 검증  | TA030~TA032  | 전 관리자 화면          | -            |

- **TA030 세부**: 공용 `empty-state`/`error-state` 재사용("신고 없음"/"제재 이력 없음"/"조치 이력 없음") + 관리자 테이블/카드 스켈레톤, 비관리자 접근은 진입 전 가드 차단(화면 안내는 error-state)
- **TA031 세부 — 조치 인터랙션(Mock)** 🔴 OPEN-2(제재 수단 채택 범위)
  - [ ] 공용 `AdminActionDialog`: **사유 필수 입력** 검증(감사 로그 reason 대비), before/after 요약 표시
  - [ ] 계정 정지/해제(기간제·영구 선택) — FA022 `1차`
  - [ ] 패널티 수동 부여/해제 — FA024 `1차` (30일 3회 누적 안내, ISSUE-004 정합)
  - [ ] 상품 강제 내림/블라인드 — FA031 `1차`
  - [ ] 거래 강제 취소/완료 — FA041 `1차`
  - [ ] 관리자 지정/회수·닉네임 강제변경·경매 강제 종료(FA023/FA025/FA032) — `2차`
- **TA032 세부 — 신고/정책 인터랙션(Mock) `2차`**: 신고 처리(제재 연결/삭제/반려, FA051) 🔴 OPEN-1 · 정책 수치 수정 시 **범위 검증 클램프 안내**(자동완료 24~168h·패널티 임계, FA061)
- **TA033 세부**: 모바일/데스크톱 반응형, 다크/라이트 시맨틱 색상, aria-live/aria-invalid/focus-visible 접근성, **Playwright MCP로 `/sample/admin`(대시보드·회원·상품·거래·조치 다이얼로그) 및 `/admin/**` 네비 검증·캡처**, `next build`+`check-all` 통과

> 🏁 **마일스톤 AM1 — 관리자 화면 완성**: 전 관리자 페이지가 Mock 데이터로 동작하고 `/sample/admin`에 전시됨. `check-all` + `next build` 통과, Playwright 인터랙션 검증 완료.

---

# 🗄️ Phase A4 · DB 설계 & RLS (Supabase MCP)

> 화면에서 쓰인 데이터 형태를 근거로 신규 테이블 스키마·RLS 설계. **Supabase MCP**로 작업.

| Task  | 상태  | 작업                                                  | 의존성       | 관련 기능         | 리스크(OPEN)      |
| ----- | ----- | ----------------------------------------------------- | ------------ | ----------------- | ----------------- |
| TA040 | - [ ] | 신규 테이블 마이그레이션 + 타입 재생성 ⭐             | AM1          | FA001/FA002/FA050 | 🔴 OPEN-3, OPEN-4 |
| TA041 | - [ ] | 블라인드 플래그 컬럼 추가 (products/messages/ratings) | TA040        | FA031/FA070/FA080 | 🔴 OPEN-2         |
| TA042 | - [ ] | RLS 정책 + `is_admin()` 헬퍼 + FK 커버링 인덱스       | TA040        | FA001             | -                 |
| TA043 | - [ ] | security/performance advisor 점검 (ERROR 0)           | TA041, TA042 | -                 | -                 |

- **TA040 세부 — 신규 테이블(PRD_ADMIN "🗄️ 데이터 모델")**
  - [ ] `admin_users`(user_id PK→profiles.id, role text 기본 `admin`, granted_by nullable, granted_at) — FA001
  - [ ] `reports`(id/reporter_id/target_type/target_id/reason/detail/status/handled_by/resolution/created_at/handled_at) — FA050~FA052 🔴 OPEN-1
  - [ ] `admin_action_logs`(id/admin_id/action_type/target_type/target_id/reason/meta jsonb/created_at) — FA002 🔴 OPEN-3
  - [ ] `user_suspensions`(id/user_id/reason/suspended_by/starts_at/ends_at nullable/lifted_at) — FA022 🔴 OPEN-4(별도 테이블 vs `profiles.suspended_until` 컬럼)
  - [ ] `generate_typescript_types`로 `lib/database.types.ts` 재생성 → `lib/types/admin*`와 1:1 정합 확인, `lib/queries/_map.ts` 매퍼 추가(snake↔camel)
- **TA041 세부 — 블라인드 플래그**: `products.is_blinded`·`messages.is_blinded`·`ratings.is_blinded`(기본 false) 추가 — 삭제와 구분(감사/복구 목적). 🔴 OPEN-2에 따라 채택 범위 조정(1차는 강제 내림 우선, 블라인드 2차 가능)
- **TA042 세부 — RLS/헬퍼/인덱스**
  - [ ] `is_admin()` SQL 헬퍼(`(select auth.uid())` in `admin_users`), `search_path=''`
  - [ ] 신규 4개 테이블 RLS 활성화: **관리자만 조회/수정**. 단 `reports`는 예외적으로 **신고자 본인 insert 허용**(FA050)
  - [ ] FK 커버링 인덱스(reports.reporter_id/handled_by, admin_action_logs.admin_id, user_suspensions.user_id/suspended_by 등) — ISSUE-019 패턴, `unindexed_foreign_keys` 0
- **TA043 세부**: 신규 테이블 `rls_enabled=true`, security advisor RLS Disabled ERROR 0, performance advisor unindexed FK ERROR 0(WARN/INFO만 허용)

---

# 🔌 Phase A5 · 실데이터 전환 & admin 조치 로직 → 마일스톤 AM2

> **UI 컴포넌트 무수정**, 조회부만 Mock→Supabase 교체. admin RPC 9종은 권한검증+상태전이+감사로그를 **단일 트랜잭션**으로 구현. 미들웨어 관리자 가드 실연결.

| Task  | 상태  | 작업                                                                                             | 의존성       | 관련 기능         | 리스크(OPEN) |
| ----- | ----- | ------------------------------------------------------------------------------------------------ | ------------ | ----------------- | ------------ |
| TA050 | - [ ] | 대시보드 집계 조회 전환 (Mock→Supabase) ⭐                                                       | TA042        | FA010~FA013       | -            |
| TA051 | - [ ] | 회원/상품/거래 목록·상세 조회 전환                                                               | TA042        | FA020/FA030/FA040 | -            |
| TA052 | - [ ] | admin RPC: 계정 정지/해제 `admin_suspend_user`·`admin_lift_suspension`                           | TA040, TA042 | FA022             | 🔴 OPEN-4    |
| TA053 | - [ ] | admin RPC: 패널티 `admin_grant_penalty`·`admin_revoke_penalty`                                   | TA042        | FA024             | 🟢 ISSUE-004 |
| TA054 | - [ ] | admin RPC: 상품 `admin_force_withdraw_product`·`admin_blind_content`·`admin_force_close_auction` | TA041, TA042 | FA031/FA032       | 🔴 OPEN-2    |
| TA055 | - [ ] | admin RPC: 거래 `admin_force_cancel_transaction`·`admin_force_complete_transaction`              | TA042        | FA041             | 🟢 ISSUE-002 |
| TA056 | - [ ] | admin RPC: 신고/정책 `admin_resolve_report`·`admin_update_policy` `2차`                          | TA040, TA042 | FA051/FA061       | 🔴 OPEN-1    |
| TA057 | - [ ] | 미들웨어 관리자 가드 실연결 (`proxy.ts`)                                                         | TA042        | FA001             | -            |
| TA058 | - [ ] | 감사 로그 열람 뷰 실데이터 연결                                                                  | TA040        | FA002             | 🔴 OPEN-3    |

- **공통 계약 — 모든 admin RPC**: **① 호출자 `admin_users` 검증 → ② 도메인 상태 전이 → ③ `admin_action_logs` 적재**를 하나의 트랜잭션으로 수행(권한 위반 시 예외). service_role 필요 mutation은 서버 전용 `createAdminClient` 경유.
- **TA050 세부**: KPI/추이/위젯/시스템상태 집계 쿼리(`count(profiles)`·`products status='active'`·당일 created_at·`transactions` 완료율·`reports pending`·`user_suspensions` 활성) — UI 무수정, `codes.policy.auto_complete_wait_hours`(24h) 기준 자동완료 대기 위젯
- **TA052 세부 — 계정 정지** 🔴 OPEN-4: `admin_suspend_user(user_id, reason, ends_at)`(영구=NULL)·`admin_lift_suspension(user_id)` → `user_suspensions` 기록 + 미들웨어/RLS 차단 반영. OPEN-4 결정에 따라 `profiles.suspended_until` 컬럼 대안 흡수
- **TA053 세부 — 패널티** 🟢 ISSUE-004: `admin_grant_penalty(user_id, reason, type)`·`admin_revoke_penalty(id)` — `penalties` insert/delete, **30일 3회 누적 시 등록 차단** 트리거(`enforce_seller_penalty_limit`)에 수동 부여도 합산
- **TA054 세부 — 상품 강제 조치** 🔴 OPEN-2: `admin_force_withdraw_product`(active→withdrawn) · `admin_blind_content(target_type,target_id,reason)`(상태 불변+is_blinded) · `admin_force_close_auction`(기존 `close_expired_auctions` 판정 로직 재사용, 즉시 낙찰/유찰)
- **TA055 세부 — 분쟁 처리** 🟢 ISSUE-002/007: `admin_force_cancel_transaction`(pending→canceled, 연쇄 이양 없이 종료) · `admin_force_complete_transaction`(pending→completed, 평판 반영 정책 확인). 기존 자동완료 24h·즉시 이양 정책과 모순 금지
- **TA056 세부 — 신고/정책 `2차`** 🔴 OPEN-1: `admin_resolve_report(report_id, resolution)`(status→resolved/rejected + 제재 연결) · `admin_update_policy(code, num_value)`(**범위 검증**: 자동완료 24~168h 클램프 ISSUE-002·패널티 임계 ISSUE-004와 모순 금지)
- **TA057 세부**: 루트 `proxy.ts`에 `/admin/**` 관리자 검증 실연결 — 세션+`admin_users` 소속 확인, 비관리자 리다이렉트. `createServerClient`~`getClaims` 사이 코드 삽입 금지·`supabaseResponse` 반환 규칙 준수(무작위 로그아웃 방지)
- **TA058 세부** 🔴 OPEN-3: 조치 시 `admin_action_logs` 자동 적재 확인 + 관리자 페이지 로그 열람 뷰 실데이터 연결(누가·언제·무엇을·왜)

> 🏁 **마일스톤 AM2 — DB 연결**: 전 관리자 화면이 실데이터로 동작, admin RPC 9종 원자 처리, 미들웨어 관리자 가드 실연결. 컴포넌트 무수정 전환 달성.

---

# ✅ Phase A6 · 통합 테스트 & 품질 → 마일스톤 AM3

> 실데이터 기준 관리자 가드·조치·정책 정합 전체 검증. Playwright MCP(가드/E2E) + Supabase MCP(RLS/RPC 롤백) + `check-all`.

| Task  | 상태  | 작업                                                      | 의존성              | 관련 기능   | 리스크(OPEN)      |
| ----- | ----- | --------------------------------------------------------- | ------------------- | ----------- | ----------------- |
| TA060 | - [ ] | 관리자 가드 E2E (비관리자/비로그인 차단) ⭐               | TA057               | FA001       | -                 |
| TA061 | - [ ] | admin RPC 권한/RLS 롤백 테스트 (관리자만 조치·일반 거부)  | TA052~TA056         | FA002~FA061 | 🔴 OPEN-3         |
| TA062 | - [ ] | 조치→상태 전이 검증 (정지/패널티/강제 내림·취소/블라인드) | TA052~TA055         | FA022~FA041 | 🔴 OPEN-2, OPEN-4 |
| TA063 | - [ ] | 기존 정책 정합성 회귀 (패널티 30일 3회·자동완료 24h)      | TA053, TA055, TA056 | -           | 🟢 ISSUE-002/004  |
| TA064 | - [ ] | 최종 품질 게이트 `npm run check-all` + advisor(ERROR 0)   | TA060~TA063         | -           | -                 |

- **TA060 세부**: Playwright MCP — 비로그인/일반 회원의 `/admin/**` 진입 시 홈(또는 404) 차단 확인, 관리자(부트스트랩 계정)만 진입·사이드바 네비 정상 캡처
- **TA061 세부**: Supabase MCP `set_config('request.jwt.claims')` 사용자 가장 — 일반 회원 롤로 admin RPC 호출 시 **권한 예외**(조치 미반영), 관리자 롤로만 상태 전이+`admin_action_logs` 적재 확인. RLS: `authenticated` 롤로 admin_users/reports/admin_action_logs/user_suspensions 가시 0(누출 없음) 🔴 OPEN-3
- **TA062 세부**: 조치 롤백 테스트 — `admin_suspend_user`→미들웨어/RLS 차단 반영, `admin_grant_penalty`→누적 합산, `admin_force_withdraw_product`(active→withdrawn)·`admin_blind_content`(is_blinded true→목록/상세 숨김)·`admin_force_cancel/complete_transaction`(pending→canceled/completed) 상태 전이 검증 후 롤백 🔴 OPEN-2/OPEN-4
- **TA063 세부**: 회귀 — FA024 수동 패널티가 **30일 3회 누적 등록 차단**(ISSUE-004) 트리거에 합산되는지, FA061 `admin_update_policy`가 **자동완료 24~168h 클램프**(ISSUE-002) 벗어난 값 거부하는지, pg_cron 잡(ISSUE-008) 정상 동작 유지 확인
- **TA064 세부**: `[ADMINTEST]` 데이터 정리(orphan 0), `npm run check-all` 통과(미들웨어 수정 포함), advisor security/performance ERROR 0, 발견 이슈 `docs/ISSUES.md` 기록, 본 로드맵·AM3 마감

> 🏁 **마일스톤 AM3 — 통합 완료**: 관리자 가드 + admin RPC 조치 + 기존 정책 정합성까지 실데이터로 검증. E2E·RLS·상태전이·회귀 통과, `check-all`+advisor(ERROR 0) 통과. **관리자 콘솔 MVP 완료.**

---

## 📊 진행 현황 요약

| Phase | 범위                       | 작업 범위       | 작업 수 | 완료 | 상태       |
| ----- | -------------------------- | --------------- | ------- | ---- | ---------- |
| A0    | 권한 모델 선행             | TA001~TA002     | 2       | 0    | ⬜ 착수 전 |
| A1    | 타입 & 라우트 골격         | TA010~TA012     | 3       | 0    | ⬜ 착수 전 |
| A2    | Mock UI 구현               | TA020~TA027     | 8       | 0    | ⬜ 착수 전 |
| A3    | 상태 화면 & 조치 인터랙션  | TA030~TA033     | 4       | 0    | ⬜ 착수 전 |
| A4    | DB 설계 & RLS              | TA040~TA043     | 4       | 0    | ⬜ 착수 전 |
| A5    | 실데이터 전환 & admin 조치 | TA050~TA058     | 9       | 0    | ⬜ 착수 전 |
| A6    | 통합 테스트 & 품질         | TA060~TA064     | 5       | 0    | ⬜ 착수 전 |
| —     | **관리자 콘솔 합계**       | **TA001~TA064** | **35**  | 0    | ⬜ 착수 전 |

## 🏁 마일스톤 개요

| 마일스톤          | 정의                                                        | 완료 기준                                                | 선행 |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------------- | ---- |
| **AM1 화면 완성** | 전 관리자 페이지가 Mock 데이터로 동작, `/sample/admin` 전시 | Phase A0~A3 완료, `check-all` 통과, Playwright 화면 검증 | -    |
| **AM2 DB 연결**   | 컴포넌트 무수정 실데이터 전환 + admin RPC 조치              | Phase A4~A5 완료, 정지/패널티/강제조치/신고처리 실동작   | AM1  |
| **AM3 통합 완료** | 관리자 가드 + 조치 + 정책 정합성 실데이터 검증              | Phase A6 완료, 가드·RLS·상태전이·회귀 검증 통과          | AM2  |

## ⚠️ 리스크 / 의존성 요약 (PRD_ADMIN OPEN 연계)

> PRD_ADMIN "❓ 확인 필요 / 미결정(OPEN)"을 옮긴 것. 🔴 OPEN은 **착수 전 사용자 확정 필요**하며, 각 항목이 게이트하는 Task를 명시한다. 기존 확정 정책(🟢)은 모순 금지 대상.

| OPEN/ISSUE | 상태 | 게이트 Task                                  | 미결정/방침                                                                        |
| ---------- | ---- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| OPEN-1     | 🔴   | TA025, TA032, TA040(reports), TA056          | 신고 시스템 최종 범위(사용자 측 신고 UI FA050 포함 여부) — 2차 도입 권장           |
| OPEN-2     | 🔴   | TA031, TA041, TA054, TA062                   | 제재 수단 채택 범위 — 1차 정지+패널티+강제 내림/취소, 블라인드/강제 종료 2차 권장  |
| OPEN-3     | 🔴   | TA001, TA002, TA040(logs), TA058, TA061      | 감사 로그 채택 여부 — **포함(필수) 권장**, 책임성 추적 사실상 필수                 |
| OPEN-4     | 🔴   | TA010, TA040(user_suspensions), TA052, TA062 | 계정 정지 구현 방식 — 별도 `user_suspensions` 테이블 vs `profiles.suspended_until` |
| OPEN-5     | 🔴   | TA001(admin_users.role)                      | 관리자 다단계 권한 도입 시점 — MVP는 단일 권한, `role` 컬럼만 확보                 |
| OPEN-6     | 🔴   | TA027, TA054(blind)                          | 채팅 메시지 열람 개인정보 정책 — 신고 방/메시지 범위 제한 + 열람 감사 권장         |
| ISSUE-002  | 🟢   | TA050, TA055, TA056, TA063                   | 자동완료 기본 24h·클램프 24~168h — FA042/FA061 정책 조정 시 모순 금지              |
| ISSUE-004  | 🟢   | TA053, TA063                                 | 패널티 30일 3회 누적 등록 차단 — FA024 수동 부여도 누적 합산                       |
| ISSUE-007  | 🟢   | TA055                                        | 낙찰 포기 즉시 이양 — FA041 강제 취소는 연쇄 이양 없이 종료(구분)                  |
| ISSUE-008  | 🟢   | TA021(FA013), TA050                          | pg_cron + DB 함수(close/auto-complete) — FA013 시스템 상태가 모니터링              |
| ISSUE-019  | 🟢   | TA042                                        | FK 커버링 인덱스 패턴 — 신규 테이블 FK 인덱스로 advisor ERROR 0 유지               |

> 🔴 **착수 전 확정 필요**: OPEN-1~6은 사용자 확정 후 Phase A0/A2/A4 진입 권장. 특히 OPEN-3(감사 로그)·OPEN-4(정지 방식)는 A0/A4 스키마를 직접 게이트한다.
