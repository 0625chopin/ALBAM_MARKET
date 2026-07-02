# 🌰 알밤마켓 개발 로드맵 (ROADMAP)

> 시작가로 경매를 열고 입찰·낙찰 후 실시간 채팅으로 약속을 잡아 **직거래**하고 서로 평점을 남기는 C2C 경매 플랫폼.

본 로드맵은 다음 문서를 기반으로 작성되었습니다.

- **기능/페이지/데이터 모델**: [`PRD.md`](./PRD.md) (F001~~F012, F020~~F021 + 정책 상수·상태 전이·NFR·서버 RPC·구현 현황)
- **개발 프로세스 골격**: [`guides/development-step-guide.md`](./guides/development-step-guide.md) (화면 우선 개발 9단계)
- **아키텍처/개발 원칙 (최우선 기준)**: [`../CLAUDE.md`](../CLAUDE.md)
- **미결정 항목 / 리스크**: [`ISSUES.md`](./ISSUES.md) (ISSUE-001~022)

---

## 📌 핵심 개발 원칙 (반드시 준수)

1. **화면 우선 개발 (Mock First)**: DB 설계/연결 **전에** Mock 데이터 + 공용 TypeScript 타입으로 화면을 먼저 완성합니다.
2. **단일 타입 계약**: Mock 데이터와 실제 DB 데이터는 **동일한 TypeScript 타입**을 공유합니다 (`lib/types/*`). 실데이터 전환 시 **UI 컴포넌트는 수정하지 않고 데이터 조회부만 교체**합니다.
3. **`/sample` 전시장**: 모든 컴포넌트는 `https://localhost:3000/sample` 에 전시하여 한곳에서 확인합니다.
4. **순수 표현 컴포넌트**: 컴포넌트는 데이터를 **props로만** 받습니다 (조회 로직을 컴포넌트 내부에 두지 않음).
5. **품질 검증**: 테스트 러너는 없습니다. `npm run check-all`(lint + format:check + typecheck), **Playwright MCP**(화면/플로우 검증), **Supabase MCP**(스키마/RLS/통합 테스트)로 검증합니다.

## 🛠️ 기술 스택 (실제 레포 기준)

| 영역       | 스택                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| 프레임워크 | Next.js App Router (latest/canary, `cacheComponents`), 미들웨어는 루트 `proxy.ts`                |
| UI         | React 19, TypeScript, **TailwindCSS v3.4.1** (v4 아님), shadcn/ui(new-york), Lucide, next-themes |
| 폼         | **useState + Supabase 클라이언트 직접 호출** (React Hook Form / Zod 미사용)                      |
| 백엔드     | Supabase `@supabase/ssr` — Auth / PostgreSQL / Storage(이미지) / Realtime(채팅)                  |
| 배포       | Vercel / npm                                                                                     |

---

## 🔁 개발 워크플로우

1. **작업 계획**: 코드베이스 현재 상태 파악 후 `ROADMAP.md`에 작업 반영. 우선순위 작업은 마지막 완료 작업 다음에 배치.
2. **작업 구현**: 단계별로 구현하고, 화면 작업은 `/sample`에서 Playwright MCP로 검증, 데이터 작업은 Supabase MCP로 검증.
3. **품질 검사**: 각 작업 종료 시 `npm run check-all` 통과 확인 (커밋 시 Husky pre-commit이 lint-staged → tsc 자동 실행).
4. **로드맵 업데이트**: 완료 작업을 `- [x]` 및 ✅로 표시. (`/docs:update-roadmap` 스킬 활용)

### 상태 범례

- `- [ ]` 대기 / `- [x]` 완료 · **🟢 진행중** · **⭐ 우선순위** · **✅ 완료**
- 의존성·ISSUE: 🔴 OPEN(미결정) · 🟡 DEFER(상수/임시값) 이슈가 걸린 작업은 **리스크**로 표기

---

# 🧱 Phase 0 · 프로젝트 정비 (스타터킷 → 도메인)

> Mock First 1단계 진입 전 준비. 스타터킷의 인증 골격을 알밤마켓 구조로 정리.

| Task | 상태 | 작업                                                                    | 의존성 | 관련 기능 | 리스크 |
| ---- | ---- | ----------------------------------------------------------------------- | ------ | --------- | ------ |
| T001 | ✅   | 스타터킷 데모/튜토리얼 컴포넌트 정리 및 `/sample` 셸 생성 ⭐ - 우선순위 | -      | -         | -      |
| T002 | ✅   | 도메인 네비게이션(홈/경매 등록/거래/프로필 + 인증) 헤더 골격 교체       | T001   | 메뉴 구조 | -      |

- **T001 세부**
  - [x] `app/page.tsx`, `components/hero.tsx`, `components/tutorial/*` 등 스타터 데모 정리(인증 골격은 유지)
  - [x] `app/sample/page.tsx` 컴포넌트 전시장 셸 생성 (섹션별 앵커)
  - [x] 시맨틱 색상 변수/`cn()` 사용 기준 점검 (다크모드 포함)
- **T002 세부**
  - [x] 전역 헤더에 홈 / 경매 등록 / 거래 / 프로필 + 로그인·회원가입 메뉴 배치
  - [x] `hasEnvVars` 미설정 시 경고 UI 동작 확인

---

# 🎨 Phase 1 · 도메인 타입 & 라우트 골격 (가이드 1~2단계)

> **데이터 계약(타입)을 먼저 고정**하고 전 화면 라우트 이동 흐름을 검증. 모든 화면 작업의 토대.

| Task | 상태 | 작업                                                | 의존성 | 관련 기능             | 리스크                    |
| ---- | ---- | --------------------------------------------------- | ------ | --------------------- | ------------------------- |
| T010 | ✅   | 도메인 공용 타입 정의 (`lib/types/*`) ⭐ - 우선순위 | -      | 전 기능 / 데이터 모델 | 🟢 ISSUE-001/005 해소     |
| T011 | ✅   | 도메인 상수 정의 (경매시간 36h 등)                  | T010   | F001, F006            | 🟢 ISSUE-001/002/003 해소 |
| T012 | ✅   | 전체 라우트 골격(빈 페이지) 스캐폴딩                | T002   | 전 페이지             | 🟢 ISSUE-011 해소         |

- **T010 세부** — Mock과 실DB가 공유할 단일 계약 (네이밍: **camelCase** 확정. Phase 5에서 Supabase snake_case↔camelCase 매핑 레이어 필요 → ISSUE-001 참조)
  - [x] `Profile`, `Category`, `Product`, `ProductImage`, `Bid`, `Transaction`, `Rating`, `ChatRoom`, `Message`, `Penalty` 인터페이스 정의 (PRD 데이터 모델 1:1 매핑) — `lib/types/*` + `lib/types/index.ts` barrel
  - [x] 상태 enum/유니온: `ProductStatus`(active/won/failed/withdrawn/completed), `BidStatus`(active/won/abandoned), `TransactionStatus`(pending/completed/auto_completed/canceled), `RatingRole`(as_seller/as_buyer)
  - [x] 파생 타입: 카드 표시용 `AuctionSummary`(대표이미지·현재가·남은시간), 상세용 `AuctionDetail`(판매자 평판 `SellerReputation` 포함)
- **T011 세부** — `lib/constants.ts`
  - [x] `DEFAULT_AUCTION_DURATION_HOURS = 36` (🟡 ISSUE-001: 추후 DB 이관 전제 상수)
  - [x] 최소 입찰 증가폭 `MIN_BID_INCREMENT = 1000` (🔴 ISSUE-003: 정액/정률/구간 미결정 → 임시 정액)
  - [x] 자동완료 대기시간 `AUTO_COMPLETE_WAIT_HOURS = 72` (🔴 ISSUE-002: 값 미결정 → 임시값 3일)
  - [x] 중고등급(`PRODUCT_CONDITIONS`)/카테고리(`CATEGORY_OPTIONS`)/지역(`REGION_OPTIONS`) 옵션 + `PRODUCT_STATUS_LABELS`
- **T012 세부** — 추가형(기존 페이지/네비 유지, 누락 동적 라우트만 신규)
  - [x] 신규 `app/auctions/[id]/page.tsx`(상세), `app/chat/[roomId]/page.tsx`(채팅), `app/profile/[id]/page.tsx`(타인 프로필) — placeholder, async params await
  - [x] 홈은 기존 `app/page.tsx` 유지, 로그인/회원가입은 기존 `app/auth/*` 활용
  - [x] `/chat`을 미들웨어 화면우선 임시 허용에 추가, `/sample`에 라우트 점검 링크 섹션 추가, 빈 페이지 간 네비게이션 이동 흐름 검증(Playwright)
  - [x] `next build` 통과 — 동적 라우트 3개가 Partial Prerender(◐)로 정상 처리 (ISSUE-011: BottomNav `usePathname`을 루트 레이아웃에서 Suspense로 감쌈)

---

# 🖼️ Phase 2 · Mock UI 구현 (가이드 3단계, 기능 영역별 세분화)

> 1단계 타입에 맞춘 Mock 데이터로 순수 표현 컴포넌트를 만들고 모두 `/sample`에 전시. **DB 없이 화면부터 완성.**

| Task | 상태 | 작업                                            | 의존성 | 관련 기능             | 리스크         |
| ---- | ---- | ----------------------------------------------- | ------ | --------------------- | -------------- |
| T020 | ✅   | Mock 데이터셋 + 공용 UI/포맷 유틸 ⭐ - 우선순위 | T010   | 전 기능               | -              |
| T021 | ✅   | 경매 카드 & 홈(목록) 화면                       | T020   | F002                  | -              |
| T022 | ✅   | 경매 상세 화면 (갤러리·정보·타이머·평판)        | T020   | F003, F012            | -              |
| T023 | ✅   | 입찰/즉시구매 패널 UI                           | T022   | F004, F005            | 🟢 ISSUE-003   |
| T024 | ✅   | 경매 등록 폼 화면                               | T020   | F001                  | 🟢 ISSUE-001   |
| T025 | ✅   | 거래 목록 화면 (낙찰/판매 구분·상태·액션)       | T020   | F006~F008, F010, F011 | 🟢 004/006/007 |
| T026 | ✅   | 채팅 화면 (메시지 리스트·입력·거래완료)         | T020   | F009, F010            | -              |
| T027 | ✅   | 프로필 화면 (평판·레벨·수정 폼)                 | T020   | F012, F021            | 🟢 ISSUE-005   |

- **T020 세부**
  - [x] `lib/mocks/*` — 각 타입별 더미 데이터 + 파생(AuctionSummary/AuctionDetail/SellerReputation), barrel `lib/mocks/index.ts`
  - [x] `lib/format.ts` — 가격(`Intl.NumberFormat`)·남은시간·별점·레벨·시각 포맷 유틸
  - [x] shadcn/ui 확충(avatar/dialog/textarea/separator/skeleton/select/radio-group/tabs/scroll-area/aspect-ratio), 공통 표현 컴포넌트 `components/common/*`(image-placeholder/status-badge/star-rating/level-badge/remaining-time)
  - [x] `lib/constants`에 `TRANSACTION_STATUS_LABELS` 추가
- **T021 세부**: 카드 그리드(대표 이미지·현재가·마감 타이머), 반응형 그리드, 카드→상세 링크
- **T022 세부**: 이미지 갤러리, 상세 정보, 현재가/마감 타이머, **판매자 평점·레벨 표시(F012)**, 종료 시 낙찰/유찰 배지
- **T023 세부**: 입찰가 입력+검증(현재가+증가폭/본인 상품 차단 UI), 입찰 버튼, 즉시구매 버튼(즉시구매가 설정 시), 비로그인 시 로그인 유도
- **T024 세부**: 다중 이미지 업로드 UI·대표 이미지 지정, 카테고리/지역/중고등급 선택, 시작가/즉시구매가(>시작가 검증), 36시간 마감 자동 표기
- **T025 세부**: 거래 목록(낙찰/판매 구분, 상태별 배지), 채팅하기/거래완료/경매취소(낙찰 포기)/상품 내리기 액션 버튼, 평점 모달(10점)
- **T026 세부**: 메시지 리스트(좌/우 정렬), 입력·전송 UI, 상대 닉네임·평점 표시, 구매자 거래완료 버튼
- **T027 세부**: 닉네임·지역·아바타 표시/수정 폼, 판매자/구매자 역할별 평균 별점·레벨 표시

---

# 🔀 Phase 3 · 상태 화면 & 인터랙션 (가이드 4~5단계 → "화면 완성")

> Loading/Empty/Error 3종 상태와 클라이언트 인터랙션 완성. **여기까지가 "화면 완성" 마일스톤.**

| Task | 상태 | 작업                                          | 의존성     | 관련 기능              | 리스크         |
| ---- | ---- | --------------------------------------------- | ---------- | ---------------------- | -------------- |
| T030 | ✅   | 전 화면 Loading/Empty/Error 상태 ⭐           | T021~T027  | F002, F003 등          | -              |
| T031 | ✅   | 입찰/즉시구매/등록 폼 인터랙션                | T023, T024 | F001, F004, F005       | 🟢 ISSUE-003   |
| T032 | ✅   | 거래 액션 인터랙션 (완료/취소/내리기/평점)    | T025       | F007, F008, F010, F011 | 🟢 004/006/007 |
| T033 | ✅   | 반응형·다크모드·접근성 + Playwright 화면 검증 | T030~T032  | 전 화면                | -              |

- **T030 세부** ✅: 공용 `empty-state`/`error-state` + 화면별 스켈레톤(경매카드/그리드·거래·메시지·프로필), 라우트 `loading.tsx` 5종 + 루트 `error.tsx`(use client+reset, SiteHeader 의존성 회피 자체완결형) + `not-found.tsx`. `/sample` `state-showcase`(Tabs 3상태 토글) 등록. **(정합화) 홈 빈 목록도 공용 `EmptyState`로 통일(`auction-grid`)**
- **T031 세부** ✅: `bid-panel` 입찰가 검증(🟢 ISSUE-003 정액 1,000원 확정, `codes.policy.min_bid_increment` 주입)·실 RPC(place_bid/buy_now)·현재가 서버확정값 갱신, `auction-form` 필수값/즉시구매가 검증+실등록(🟢 ISSUE-004 패널티 등록 제한 배너), `profile-edit-form` 닉네임 검증+저장. **(정합화) 즉시구매 낙찰 후 거래 내역 이동 CTA 추가**
- **T032 세부** ✅: 공용 `confirm-dialog`, `transaction-card`(RSC) 액션부를 `transaction-actions`(client)로 분리 — 거래완료/낙찰 포기 실 RPC(complete_transaction/abandon_won_auction), **차순위 즉시 이양(🟢 ISSUE-007)+포기 패널티 누적 제한(🟢 ISSUE-004) 안내**, 상품 내리기는 `withdraw-product-button`(🟢 ISSUE-006 패널티 후 허용), `rating-modal` 별점 검증·코멘트 저장(🟢 ISSUE-016)
- **T033 세부** ✅: 모바일(430)/데스크톱(1280) 반응형, 다크/라이트 모드(시맨틱 색상 반전), 모바일 내비는 BottomNav(ISSUE-009 해소), aria-live/aria-invalid/focus-visible 접근성, **Playwright MCP로 `/sample`(입찰·즉시구매·폼·거래액션·평점) 및 주요 라우트 검증·캡처**, `next build`+`check-all` 통과

> 🏁 **마일스톤 M1 — 화면 완성 ✅**: 모든 페이지가 Mock 데이터로 동작하고 `/sample`에 전시됨. `npm run check-all` + `next build` 통과, Playwright 인터랙션 검증 완료.

---

# 🗄️ Phase 4 · Supabase DB 설계 & RLS (가이드 6~7단계)

> 화면에서 쓰인 데이터 형태를 근거로 스키마 설계. **Supabase MCP**로 작업.

| Task | 상태 | 작업                                      | 의존성   | 관련 기능        | 리스크       |
| ---- | ---- | ----------------------------------------- | -------- | ---------------- | ------------ |
| T040 | ✅   | 코어 스키마 마이그레이션 + 타입 재생성 ⭐ | T010, M1 | 데이터 모델 전체 | -            |
| T041 | ✅   | RLS 정책 정의 + 보안 advisor 점검         | T040     | F020             | -            |
| T042 | ✅   | Storage 버킷(상품 이미지/아바타) + 정책   | T040     | F001, F021       | -            |
| T043 | ✅   | 평판/레벨 산정 로직 스키마 반영           | T040     | F011, F012       | 🟢 ISSUE-005 |

- **T040 세부** ✅ (리스크 격리 위해 T040-A/T040-B로 분할 실행)
  - [x] **T040-A**: 스타터 `profiles` 비파괴 정합화(`ALTER ADD` nickname/region/seller_level/buyer_level + 기존 2행 백필), `handle_new_user()` nickname 반영(`CREATE OR REPLACE`), `categories` 생성 + `CATEGORY_OPTIONS` 10종 시드 + RLS 공개 read. nickname NOT NULL은 Phase 5 연기(🟡 ISSUE-014)
  - [x] **T040-B**: `products/product_images/bids/transactions/ratings/chat_rooms/messages/penalties` 8종 생성, PK/FK/인덱스(`products.status`, `bids.product_id`, `messages(room_id,created_at)` 등), 제약(`buy_now_price>start_price`, `current_price>=start_price`, `score 1~10`, 상태 enum, `ratings` 거래당 1회 UNIQUE)
  - [x] `generate_typescript_types`로 `lib/database.types.ts` 재생성 → `lib/types/*`와 1:1 정합성 확인(snake↔camel 매핑은 Phase 5/ISSUE-012). `npm run check-all` 통과
- **T041 세부** ✅: 신규 8개 테이블 RLS 활성화 + 정책(공개 SELECT: products/product_images/bids/ratings; 본인 seller 쓰기; 본인 상품 입찰 차단; 거래/채팅 당사자 제한; messages 방 당사자 조회·작성; penalties 본인 조회). `profiles/categories`는 기존 정책 완비. `auth.uid()`는 `(select auth.uid())` 최적화. 전 10개 도메인 테이블 `rls_enabled=true`, RLS Disabled ERROR 0
- **T042 세부** ✅: `product-images`/`avatars` 버킷(public read, 5MB, image/\* 한정), `storage.objects` 정책(공개 read + 본인 경로 insert/update/delete, 첫 폴더 토큰=`auth.uid()`). **경로 컨벤션**: `avatars/{userId}/...`, `product-images/{userId}/{productId}/...`. 기존 업로드 UI(`auction-form`/`profile-edit-form`) 무변경 — 실제 업로드 연동(반환 url→`product_images.url`/`profiles.avatar_url`)은 Phase 5(T052/T050)
- **T043 세부** ✅: 집계 뷰 `public.profile_reputation`(역할별 평균 별점·평가 수·완료 거래 수, `security_invoker=on`) + 임시 산정 함수 `public.calc_reputation_level(int,numeric)`(`1 + floor(완료/5) + 별점보정`, 가중치 분리·`search_path=''`). `profiles.seller_level/buyer_level` 캐시 재계산 동기화는 Phase 5(T059) 연기 (🔴 ISSUE-005 미결정)

---

# 🔌 Phase 5 · 실데이터 전환 & 핵심 거래 로직 (가이드 8단계)

> **UI 컴포넌트 무수정**, 데이터 조회부만 Mock → Supabase로 교체. 동시성·자동화 등 난도 높은 도메인 로직 구현.

| Task | 상태  | 작업                                             | 의존성     | 관련 기능        | 리스크       |
| ---- | ----- | ------------------------------------------------ | ---------- | ---------------- | ------------ |
| T050 | - [x] | 인증 연동 (회원가입/로그인/로그아웃/프로필) ⭐   | T041       | F020, F021       | -            |
| T051 | - [x] | 경매 조회 전환 (홈/상세) — Mock→Supabase         | T040       | F002, F003, F012 | -            |
| T052 | - [x] | 경매 등록 전환 (이미지 업로드 포함)              | T042, T050 | F001             | 🟡 ISSUE-001 |
| T053 | - [x] | **입찰 + 즉시구매 (원자적/동시성 처리)**         | T051       | F004, F005       | 🟢 ISSUE-003 |
| T054 | - [x] | **경매 자동 종료/낙찰/유찰 (스케줄러)**          | T053       | F006             | 🟢 ISSUE-008 |
| T055 | - [x] | **낙찰 포기 → 차순위 연쇄 이양 + 포기자 패널티** | T054       | F007             | 🟢 004/007   |
| T056 | - [x] | 상품 내리기 (입찰 전/후 제한)                    | T053       | F008             | 🟢 ISSUE-006 |
| T057 | - [x] | **낙찰 후 실시간 채팅 (Supabase Realtime)**      | T054, T050 | F009             | -            |
| T058 | - [x] | **거래완료 + 자동완료 (스케줄러)**               | T057       | F010             | 🟢 002/008   |
| T059 | - [x] | 상호 별점(10점) + 평판/레벨 반영                 | T058       | F011, F012       | 🟢 005       |

- **T053 세부 — 동시성 핵심**
  - [x] 입찰: 현재가+증가폭 검증·본인 상품 차단·`current_price` 갱신을 **단일 트랜잭션/RPC(원자적)** 처리 (경합 시 최신 현재가 기준 재검증) — `place_bid` RPC
  - [x] 즉시구매: 즉시구매가 도달 시 경매 즉시 종료 + 낙찰자 확정 + 거래/채팅 생성을 원자적으로 처리 (입찰과의 레이스 컨디션 방지) — `buy_now` RPC
  - [x] 🟢 ISSUE-003: 정액 1,000원 확정, `codes.policy.min_bid_increment` 단일 소스 + RPC 최종검증
- **T054 세부 — 자동 종료 (🟢 ISSUE-008 해소)**
  - [x] 실행 메커니즘: **`pg_cron` + DB 함수** 확정(Edge Function/외부 스케줄러 미사용)
  - [x] 36시간 만료 시 최고가 자동 낙찰, 입찰 없으면 유찰, 낙찰 시 `transactions`/`chat_rooms` 생성 — `close_expired_auctions()` 매분 active
- **T055 세부 — 연쇄 이양 (🟢 ISSUE-004/007 확정)**
  - [x] 낙찰 포기 시 차순위 입찰자에게 **그의 입찰가**로 연쇄 이양, 입찰자 소진 시 유찰
  - [x] 포기자 `penalties` 기록 (🟢 ISSUE-004 확정: 30일 3회 누적 시 경매 등록 차단 — `enforce_seller_penalty_limit` 트리거)
  - [x] 🟢 ISSUE-007 확정: 차순위 수락 대기시간 미적용(즉시 이양)
- **T057 세부 — 실시간 채팅**
  - [x] `messages` Realtime 구독, 낙찰 시 자동 생성된 방만 접근(RLS), 메시지 저장·정렬, 상대 평점 표시 — `phase5_realtime_messages`
- **T058 세부 — 거래완료/자동완료 (🟢 ISSUE-002/008 해소)**
  - [x] 구매자 거래완료 확정 → `transactions.status=completed` — `complete_transaction` RPC
  - [x] 미클릭 시 대기시간 경과 후 `auto_completed` (대기값 🟢 ISSUE-002 기본 24h 확정 `codes.policy.auto_complete_wait_hours`, 실행은 `auto_complete_transactions()` 매분 active)
- **T059 세부**: 거래완료 후 판매자↔구매자 10점 별점 거래당 1회, 역할별 평균/레벨 반영(🔴 ISSUE-005 산정식)

> 🏁 **마일스톤 M2 — DB 연결**: 전 화면이 실데이터로 동작. 컴포넌트 무수정 전환 달성.

---

# ✅ Phase 6 · 통합 테스트 & 품질 (가이드 9단계)

> 실데이터 기준 전체 플로우 검증. Playwright MCP(E2E) + Supabase MCP(권한/데이터) + `check-all`.

| Task | 상태 | 작업                                                          | 의존성     | 관련 기능  | 리스크         |
| ---- | ---- | ------------------------------------------------------------- | ---------- | ---------- | -------------- |
| T060 | ✅   | 핵심 거래 플로우 E2E (등록→즉시구매→낙찰→채팅→완료→평점) ⭐   | T050~T059  | F001~F012  | -              |
| T061 | ✅   | 동시성·엣지 케이스 검증 (입찰 경합/즉시구매 레이스/연쇄 이양) | T053~T055  | F004~F007  | 🔴 003/004/007 |
| T062 | ✅   | 인증·RLS 권한 시나리오 (비로그인/타인 데이터/채팅 접근)       | T041, T050 | F020       | ISSUE-017 해결 |
| T063 | ✅   | 자동 종료/자동완료 스케줄러 검증                              | T054, T058 | F006, F010 | 🟢 ISSUE-008   |
| T064 | ✅   | 최종 품질 게이트 `npm run check-all` + advisor                | T060~T063  | -          | -              |

- **T060 세부** ✅: Playwright MCP로 사용자 여정 전체 검증. 즉시구매 경로로 36h 대기 우회 — 판매자(chopin0625) 등록(이미지 Storage 업로드) → 구매자(0625chopin) `buy_now`로 원자적 product=won·거래(pending)·채팅방 생성 → 메시지 송수신(Realtime) → `complete_transaction`(completed) → 양방향 `submit_rating`(9/10) → 구매자 buyer_level 2→3 재계산 확인. 캡처 p6-flow-01~06. 발견: 평점 comment 미저장(🟡 ISSUE-016)
- **T061 세부** ✅: `set_config('request.jwt.claims')` 사용자 가장으로 RPC 직접 검증 — place_bid 현재가 단조 증가(11000→12000)·증가폭 미달 거부, 본인 상품 입찰 차단, buy_now 후 입찰 "종료된 경매" 거부(이중 낙찰 0·거래 1건), abandon_won_auction 차순위 그의 입찰가로 연쇄 이양→입찰자 소진 시 failed + penalties 적재
- **T062 세부** ✅: 미들웨어 비로그인 보호 복원(🟢 ISSUE-017) 후 Playwright 재검증 — `/auctions/new`·`/transactions`·`/chat/[id]`·`/profile` → `/auth/login` 차단, `/auctions/[id]`·`/profile/[id]`·홈 공개 유지. SQL RLS — `authenticated` 롤 가장으로 타인 penalties/messages/transactions 가시 0(누출 없음). advisor(security) ERROR 0
- **T063 세부** ✅: cron.job 2종(close_expired_auctions/auto_complete_transactions, 매분 active) 확인. 시점 조작+함수 직접 호출로 close_expired_auctions(입찰 有→won+거래/채팅, 입찰 無→failed)·auto_complete_transactions(73h pending→auto_completed, 기준 컬럼 created_at/72h) 검증 (ISSUE-008 pg_cron 확정)
- **T064 세부** ✅: `[P6TEST]` 데이터 정리(orphan 0, 시드 7 보존), `npm run check-all` 통과(미들웨어 수정 포함), advisor security/performance ERROR 0(WARN/INFO만), 발견 이슈 ISSUE-016~019 기록, ROADMAP·M3 마감

> 🏁 **마일스톤 M3 — 통합 테스트 완료 ✅**: 핵심 거래 흐름 + 채팅/평점까지 실데이터로 검증. E2E·동시성·RLS·스케줄러 검증 통과, `check-all`+advisor(ERROR 0) 통과. **MVP 완료.**

---

# 🚀 Phase 7 · MVP 이후 (제외 범위, 추후)

> PRD "MVP 이후 기능 (제외)". 본 로드맵 범위 밖이며, 선행 ISSUE 결정 후 착수.

| Task | 상태    | 작업                                                            | 비고                                                                                                                                                                                           |
| ---- | ------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T070 | - [ ]   | 인앱 알림(입찰됨/상위입찰 밀림/마감 임박/채팅 수신)             | MVP 이후                                                                                                                                                                                       |
| T071 | 🟢 부분 | 검색·필터·정렬(키워드/카테고리/지역/가격/상태)                  | **홈 상태 필터만 선반영**(4ae51a8), 키워드·가격·지역 필터·정렬 미구현                                                                                                                          |
| T072 | - [ ]   | 관심목록(찜)                                                    | MVP 이후                                                                                                                                                                                       |
| T073 | - [ ]   | 풀 마이페이지 대시보드(판매/구매 통계, 패널티 현황)             | MVP 이후                                                                                                                                                                                       |
| T074 | - [ ]   | 관리자/신고·제재, 다국어(i18n: ko/en/ja)                        | MVP 이후 (가이드 i18n 전략 참조)                                                                                                                                                               |
| T075 | - [~]   | 미결정 정책 DB 이관 (경매시간/자동완료/증가폭/패널티/레벨)      | 공통코드(code_groups/codes) 도입 — 경매시간/자동완료/증가폭·중고등급/지역/카테고리/상태 이관 완료. 패널티 이용제한 정책도 codes.policy 이관(ISSUE-004). 레벨 산정식(005)은 함수 교체 방식 유지 |
| T076 | - [x]   | 미저장 필드 반영: 상품 설명(description) · 평점 코멘트(comment) | ✅ ISSUE-015 / ISSUE-016 DONE — 컬럼 추가 + 타입/매퍼/폼/RPC 반영, check-all·롤백 테스트 통과                                                                                                  |

- **T071 세부 — 홈 상태 필터(부분 구현)**
  - [x] 홈 상단 상태 필터 탭 6종(전체/경매중(기본)/낙찰/유찰/내림/완료), `?status=` 쿼리 기반 서버 사이드 필터(`AuctionStatusFilter` + `fetchAuctionSummaries(status)`) — 커밋 `4ae51a8`
  - [ ] 키워드 검색, 가격·지역·카테고리 필터, 정렬(마감임박/최신/인기) — 미구현(MVP 이후)
- **T076 세부 — 미저장 필드 반영 (PRD 데이터 모델) ✅**
  - [x] ISSUE-015: `products` + `description` 컬럼 추가 → `CreateAuctionInput`/insert·`Product` 타입·매퍼(`_map.ts`)·상세 표시(`auction-info.tsx`) 반영
  - [x] ISSUE-016: `ratings` + `comment` 컬럼 + `submit_rating` `p_comment` 인자 → 뮤테이션/타입/모달 호출 반영
  - [x] 두 이슈는 동일 패턴(폼 입력 O·DB 컬럼 X)이라 함께 처리. `apply_migration` 후 `generate_typescript_types` 재생성, check-all 통과

---

## 📊 진행 현황 요약

| Phase | 단계(가이드)        | 작업 범위     | 작업 수 | 완료 | 상태    |
| ----- | ------------------- | ------------- | ------- | ---- | ------- |
| 0     | 사전 정비           | T001~T002     | 2       | 2    | ✅ 완료 |
| 1     | 타입·골격 (1~2)     | T010~T012     | 3       | 3    | ✅ 완료 |
| 2     | Mock UI (3)         | T020~T027     | 8       | 8    | ✅ 완료 |
| 3     | 상태·인터랙션 (4~5) | T030~T033     | 4       | 4    | ✅ 완료 |
| 4     | DB·RLS (6~7)        | T040~T043     | 4       | 4    | ✅ 완료 |
| 5     | 실데이터·로직 (8)   | T050~T059     | 10      | 10   | ✅ 완료 |
| 6     | 통합 테스트 (9)     | T060~T064     | 5       | 5    | ✅ 완료 |
| 7     | MVP 이후            | T070~T076     | 7       | 1    | 보류¹   |
| —     | **MVP 합계**        | **T001~T064** | **36**  | 36   | ✅ 완료 |

> ¹ Phase 7은 보류 범위이나 일부 선반영됨: **T076 미저장 필드(description/comment) 완료**, **T075 미결정 정책 공통코드 DB 이관 대부분 완료**(레벨 산정식 제외, `- [~]`), **홈 상태 필터**(T071 슬라이스, 커밋 `4ae51a8`) 선반영. 완료 열은 온전히 완료된 T076만 집계.

## 🏁 마일스톤 개요

| 마일스톤         | 정의                                           | 완료 기준                                              | 선행 |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------ | ---- |
| **M1 화면 완성** | 전 페이지가 Mock 데이터로 동작, `/sample` 전시 | Phase 0~3 완료, `check-all` 통과, Playwright 화면 검증 | -    |
| **M2 DB 연결**   | 컴포넌트 무수정으로 실데이터 전환 + 핵심 로직  | Phase 4~5 완료, 입찰/낙찰/채팅/거래완료 실동작         | M1   |
| **M3 통합 완료** | MVP 거래 흐름 + 채팅/평점 실데이터 검증        | Phase 6 완료, E2E·RLS·동시성·스케줄러 검증 통과        | M2   |

## ⚠️ 리스크 / 의존성 요약 (ISSUES 연계)

| ISSUE | 상태 | 영향 작업        | 로드맵 처리 방침                                                        |
| ----- | ---- | ---------------- | ----------------------------------------------------------------------- |
| 001   | 🟢   | T011, T024, T052 | DB 공통코드 이관 완료(codes.policy) — 컬럼 DEFAULT 자동설정             |
| 002   | 🟢   | T058, T063       | 기본 24h 확정, 24~168h DB 조정 가능(RPC 클램프 가드)                    |
| 003   | 🟢   | T023, T031, T053 | 정액 방식 1,000원 확정(DB codes.policy 단일 소스+RPC 최종검증)          |
| 004   | 🟢   | T055, T061       | 이용 제한 확정: 30일 3회 누적 시 등록 차단(트리거+codes.policy)         |
| 005   | 🟢   | T043, T059       | 현재 산정식 확정(가중치 조정은 calc_reputation_level 교체로 대응)       |
| 006   | 🟢   | T056             | 패널티 후 허용 확정(입찰 시 penalties 기록, 004 누적 대상)              |
| 007   | 🟢   | T055             | 즉시 이양 확정(차순위 수락 대기 미적용)                                 |
| 008   | 🟢   | T054, T058, T063 | **해결**: `pg_cron`+DB 함수 확정, cron 2종(close/auto-complete) active  |
| 014   | 🟢   | T040-A, T050     | nickname NOT NULL 적용(트리거 폴백 + 가입 폼 닉네임) — 2026-07-02       |
| 015   | 🟢   | T076(후속)       | `products.description` 컬럼 추가 + 타입/매퍼/폼/상세표시 반영 완료      |
| 016   | 🟢   | T076(후속)       | `ratings.comment`+`submit_rating` p_comment 인자 추가 완료              |
| 018   | 🟢   | T062(후속)       | 스타터 groups 잔재 제거 + get_policy_int anon 노출 차단 — 2026-07-02    |
| 019   | 🟢   | T064(후속)       | 도메인 FK 커버링 인덱스 8건 추가(unindexed_foreign_keys 0) — 2026-07-02 |
| 010   | 🟢   | 레이아웃         | `html lang` en → ko 고정(다국어는 T074) — 2026-07-02                    |
| 012   | 🟢   | T051~            | snake↔camel 매핑 레이어 `lib/queries/_map.ts`로 구현(컴포넌트 무수정)   |
| 021   | 🟢   | T059(후속)       | 재제출 멱등 처리(`ON CONFLICT DO NOTHING` no-op) — 롤백 테스트 통과     |
| 022   | 🟢   | T051/T052(후속)  | `ProductImage` onError 폴백(카드·갤러리) — 깨진 아이콘 제거             |

> ✅ **ISSUE-008 해소**: 자동 종료/완료 실행 메커니즘은 `pg_cron` + DB 함수(plpgsql)로 확정·구현되었습니다(Edge Function/외부 스케줄러 미사용). `cron.job`에 `close-expired-auctions`·`auto-complete-transactions` 2종이 매분 active.
