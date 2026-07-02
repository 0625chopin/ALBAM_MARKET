# 개발 이슈 / 개선사항 (ISSUES)

> 개발 중 발생한 **결정되지 않은 사항(결정 X)** 및 **개선 아이디어**를 기록합니다. (CLAUDE.md 「개발중 이슈 관련사항」 규칙)
> 확정된 의사결정은 여기가 아니라 요구사항/설계 문서에 반영합니다.

## 상태 범례

- 🔴 **OPEN**: 미결정, 결정 필요
- 🟡 **DEFER**: 추후 처리 예정(현재는 상수/임시값 사용)
- 🟢 **DONE**: 해결/반영됨

---

## 이슈 목록

| ID        | 상태    | 분류   | 제목                                                                        | 비고                                                                    |
| --------- | ------- | ------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ISSUE-009 | 🟢 DONE | UI     | 모바일 헤더 메뉴(드로어/햄버거) 미구현 → 하단 BottomNav로 대체              | T033 확인, 하단 탭바가 모바일 내비 제공                                 |
| ISSUE-010 | 🟢 DONE | 국제화 | `app/layout.tsx` lang 속성 "en" → "ko" 적용                                 | MVP 한국어 고정(2026-07-02), 다국어는 Phase 7(T074)                     |
| ISSUE-011 | 🟢 DONE | 인프라 | cacheComponents 동적 라우트 prerender — Suspense 경계 패턴                  | T012에서 해결, Phase 2 참고 패턴                                        |
| ISSUE-012 | 🟢 DONE | 데이터 | 타입 네이밍 camelCase 확정 → 실DB(snake_case) 매핑 레이어 필요              | `lib/queries/_map.ts` 매핑 레이어로 구현(컴포넌트 무수정)               |
| ISSUE-013 | 🟢 DONE | 인프라 | RSC에 onClick 등 이벤트 핸들러 전달 시 500 에러 — 정적/클라이언트 분리      | T025에서 해결, Phase 3 인터랙션 참고                                    |
| ISSUE-014 | 🟢 DONE | 데이터 | `profiles.nickname` NOT NULL 제약 적용                                      | 트리거 폴백 보강 + 가입 폼 닉네임 입력 + NOT NULL (2026-07-02)          |
| ISSUE-015 | 🟢 DONE | 데이터 | `products`에 상품 설명(description) 컬럼 부재 → 등록 폼의 설명 미저장       | 컬럼 추가 + 타입/매퍼/폼/상세표시 반영 완료                             |
| ISSUE-016 | 🟢 DONE | 평판   | 평점 코멘트(comment) UI 입력되나 미저장                                     | `ratings.comment`+`submit_rating` p_comment 인자 추가 완료              |
| ISSUE-017 | 🟢 DONE | 인증   | 미들웨어 비로그인 보호 경로 복원(Phase 2 임시 허용 제거)                    | T062에서 해결                                                           |
| ISSUE-018 | 🟢 DONE | 인프라 | 스타터킷 잔재(groups/group_members + group RPC 4종) anon 노출 제거          | 테이블·함수·트리거 DROP + get_policy_int anon 노출 차단 (2026-07-02)    |
| ISSUE-019 | 🟢 DONE | 성능   | FK 커버링 인덱스 미생성 → 도메인 FK 8건 인덱스 추가                         | unindexed_foreign_keys advisor 0 (2026-07-02)                           |
| ISSUE-001 | 🟢 DONE | 경매   | 기본 낙찰시간 상수 → DB 공통코드 이관(단일값)                               | codes.policy로 이관, 컬럼 DEFAULT 자동설정                              |
| ISSUE-002 | 🟢 DONE | 거래   | 거래완료 자동완료 대기시간 결정 (저장위치는 DB 이관됨)                      | 기본 24h 확정, 24~168h DB 조정 가능(RPC 클램프)                         |
| ISSUE-003 | 🟢 DONE | 입찰   | 최소 입찰 증가폭 방식(정액/정률/구간) (저장위치는 DB 이관됨)                | 정액 방식 확정, 값 1,000원                                              |
| ISSUE-004 | 🟢 DONE | 평판   | 낙찰 포기 패널티 정책(점수/기준/제재)                                       | 이용 제한 확정: 30일 3회 누적 시 경매 등록 차단(트리거)                 |
| ISSUE-005 | 🟢 DONE | 평판   | 판매자/구매자 레벨 산정식                                                   | 현재 산정식 확정(가중치 조정은 함수 교체로 대응)                        |
| ISSUE-006 | 🟢 DONE | 상품   | 입찰 후 상품 내리기 제한 강도                                               | 패널티 후 허용 확정(입찰 시 penalties 기록, 004 누적 대상)              |
| ISSUE-007 | 🟢 DONE | 경매   | 연쇄 이양 시 차순위 수락 대기시간 적용 여부                                 | 즉시 이양 확정(대기시간 미적용)                                         |
| ISSUE-008 | 🟢 DONE | 인프라 | 경매 자동 종료/자동완료 실행 메커니즘 → **pg_cron + DB 함수**               | T054/T058 구현, cron 2종(close/auto-complete) active                    |
| ISSUE-020 | 🟢 DONE | 데이터 | 타인 프로필 `/profile/[id]` 실데이터 전환 (Mock "김알밤" → Supabase)        | 2026-06-29 해결, `fetchProfile`+`fetchProfileScores` 교체               |
| ISSUE-021 | 🟢 DONE | 평판   | 평점 제출 시 브라우저 콘솔 `submit_rating` 400 1건 관측(데이터는 정상 저장) | 재제출 멱등 처리(`ON CONFLICT DO NOTHING` no-op) — 롤백 테스트 통과     |
| ISSUE-022 | 🟢 DONE | 데이터 | 고아 `product_images.url` → Storage 객체 부재로 `/_next/image` 400          | `ProductImage` onError 폴백(카드·갤러리) — 깨진 아이콘 제거             |
| ISSUE-023 | 🟢 DONE | 경매   | 경매 진행 시간 고정(36h) → 등록자가 12시간/1~7일 선택                       | 폼 Select + `createAuction` 가 `auction_ends_at` 명시 전달 (2026-07-02) |

---

## ISSUE-001 · 기본 낙찰시간 36시간 상수 → 추후 DB 관리 🟢 DONE(단일값 이관)

- **배경**: 경매 진행 시간(`auction_ends_at` 계산 기준)을 현재는 **상수 36시간**으로 고정한다.
- **개선 방향**: 추후 **DB 데이터(설정 테이블 또는 카테고리별 정책)**로 이관하여 운영 중 변경 가능하도록 한다.
- **갱신(공통코드 이관)**: 전역 단일값을 DB 공통코드 `codes.policy.default_auction_duration_hours`로 이관 완료. `products.auction_ends_at` 컬럼 DEFAULT가 `now() + N시간`(정책값 조회 `get_policy_int`)으로 자동 설정하며, 클라이언트(`createAuction`)의 36h 계산은 제거됨. 운영 중 DB 값만 바꾸면 반영된다. (※ "카테고리별 차등 정책"은 미도입 — 필요 시 별도 확장)
- **요청 출처**: 사용자 요구사항 원본에 명시됨 ([REQUIREMENTS_O.md](./requirements/REQUIREMENTS_O.md)).
- **후속(ISSUE-023)**: 전역 단일값 자동설정에서 → **등록자가 진행 시간을 선택**하는 방식으로 변경됨(아래 ISSUE-023 참고).

## ISSUE-023 · 경매 진행 시간 등록자 선택 🟢 DONE

- **배경**: 등록 시 진행 시간이 정책값(36h) 컬럼 DEFAULT로 고정되어 사용자가 고를 수 없었다.
- **결정(사용자)**: 등록자가 **12시간 / 1일 / 2일 / 3일 / 4일 / 5일 / 6일 / 7일** 중 선택. 기본 선택값 1일(24h).
- **반영**:
  - 진행 시간 옵션을 **공통코드 `codes.auction_duration`**(code=시간 문자열, label, num_value=시간)으로 이관. 다른 옵션(카테고리/지역/등급)과 동일하게 `fetchAuctionDurationOptions`(`lib/queries/codes.ts`)가 **프로세스 싱글턴**(그룹별 최초 1회 DB 조회 후 재사용)으로 로딩. 하드코딩 옵션 배열은 제거(상수 파일엔 초기 선택값 폴백 스칼라만 유지).
  - 폼(`components/auctions/auction-form.tsx`)이 `durationOptions` prop 을 받아 shadcn `Select` 렌더 + 예상 마감 시각 안내. 페이지/쇼케이스가 실데이터/Mock 옵션을 주입.
  - `createAuction`(`lib/mutations/auctions.ts`)이 선택값 기준 `now()+N시간`을 계산해 `auction_ends_at`을 **명시 전달**(미전달 시에만 컬럼 DEFAULT 적용).
  - 서버 검증: BEFORE INSERT 트리거 `validate_auction_ends_at`(마이그레이션 `validate_auction_ends_at_range`)로 12시간~7일 범위 강제(조작 방지).
- **주의(정정)**: 기존 코드 주석의 "서버 트리거 `set_auction_ends_at`" 언급은 부정확했음 — 실제로는 `products.auction_ends_at` **컬럼 DEFAULT**가 채우던 구조.

## ISSUE-002 · 거래완료 자동완료 대기시간 🟢 DONE(기본 24h 확정, DB 조정 가능)

- **배경**: 구매자가 거래완료 버튼을 누르지 않을 때 일정 시간 후 **자동완료**(판매자 보호)한다.
- **결정(확정, 사용자)**: 기본 대기시간을 **24시간**으로 확정. 운영 중 `codes.policy.auto_complete_wait_hours` DB 값으로 **24~168시간(1주)** 범위 내 조정 가능하도록 유지한다.
- **반영**:
  - DB 공통코드 `codes.policy.auto_complete_wait_hours` `num_value` 72 → **24**.
  - RPC `auto_complete_transactions`가 `get_policy_int`로 조회한 값을 **`greatest(24, least(168, ...))` 클램프**로 감싸 범위 밖 값을 방어(폴백 24h). 마이그레이션 `resolve_issue_002_auto_complete_wait`.
  - 클라이언트 폴백 상수 `AUTO_COMPLETE_WAIT_HOURS`(`lib/constants.ts`) 72 → 24 동기화.
- **기준 시각(참고)**: 카운트 기준은 거래 `created_at`(낙찰 성립 시점)이다. 향후 "거래완료 확인 대기 시작 시점"으로 세분화가 필요하면 별도 이슈로 다룬다.

## ISSUE-003 · 최소 입찰 증가폭(입찰 단위) 🟢 DONE(정액 방식 1,000원 확정)

- **배경**: 입찰가는 현재가 + 최소 증가폭 이상이어야 한다.
- **결정(확정, 사용자)**: **정액 방식**으로 확정하고 값은 **1,000원**을 유지한다. (정률/구간 방식은 채택하지 않음)
- **반영**: 값 변경이 없으므로 DB(`codes.policy.min_bid_increment=1000`)·RPC(`place_bid`)·클라이언트 검증식 모두 무변경. 코드 주석의 "미결정" 표기만 확정 문구로 갱신(`lib/constants.ts`, `components/auctions/bid-panel.tsx`).
- **구조(유지)**: DB 공통코드 `codes.policy.min_bid_increment` 단일 소스 → 서버 RPC `place_bid`가 `get_policy_int`로 최종 검증, 클라이언트 `bid-panel`은 `minBidIncrement` prop(`fetchPolicies` 주입)으로 UX 사전검증. 향후 금액 조정은 DB 값만 변경하면 반영된다.

## ISSUE-004 · 낙찰 포기 패널티 정책 🟢 DONE(이용 제한 확정)

- **배경**: 낙찰자가 경매취소(낙찰 포기) 시 포기자에게 패널티를 부과한다.
- **결정(확정, 사용자)**: 제재 형태는 **이용 제한(누적)** 으로 확정. **최근 30일 이내(rolling window) 패널티가 3회 이상 누적되면 경매 등록(판매)을 차단**한다. (점수 차감/레벨 하락 방식은 미채택 — 향후 필요 시 별도 확장)
- **패널티 집계 대상(통합)**: `penalties`는 user_id 단위로 집계되며, **낙찰 포기(`abandon_won`)** 와 **입찰 상품 내림(`withdraw_with_bids`, ISSUE-006)** 이 모두 누적 대상이다. 낙찰 포기 패널티는 포기한 낙찰자(구매자)에게, 상품 내림 패널티는 판매자에게 기록되지만, 제한은 이 둘을 합산해 해당 사용자의 경매 등록을 차단한다.
- **반영**:
  - DB: `penalties.penalty_type` 컬럼 추가(유형 구분, 카운트는 유형 무관). 공통코드 `codes.policy.penalty_restriction_threshold=3`·`penalty_window_days=30` 시드(운영 중 DB 값으로 조정 가능).
  - DB: `products` BEFORE INSERT 트리거 `enforce_seller_penalty_limit()` 신설 — `get_policy_int`로 임계/기간 조회, 최근 N일 penalties 카운트가 임계 이상이면 등록 예외. `SECURITY DEFINER`+`search_path=''`, REST 노출 회수(트리거 전용).
  - 클라이언트: `fetchMyPenaltyStatus`(`lib/queries/penalties.ts`) 조회 → `app/auctions/new` 서버 페이지가 폼에 주입 → `auction-form` 제한 배너 + 제출 버튼 비활성(UX 사전차단, 최종 강제는 서버 트리거). 폴백 상수 `PENALTY_RESTRICTION_THRESHOLD=3`/`PENALTY_WINDOW_DAYS=30`(`lib/constants`).
- **검증**: 트랜잭션 롤백 테스트로 30일내 3건→등록 차단, 2건→허용, 30일 밖 3건→허용 확인. advisor ERROR 0.

## ISSUE-005 · 판매자/구매자 레벨 산정식 🟢 DONE(현재 산정식 확정)

- **배경**: 레벨 = 거래 성사 건수 + 받은 별점 종합(역할별 별도 집계).
- **결정(확정, 사용자)**: 현재 산정식 `레벨 = 1 + floor(완료건수 / 5) + 평점보너스(평균≥9 → +2, ≥7 → +1, else 0)`를 **MVP 최종 산정식으로 확정**한다. 가중치/임계값 조정이 필요하면 `calc_reputation_level` 함수만 교체하면 되는 구조를 유지한다(DB/타입 변경 없음).
- **구현(T043/T059 유지)**: 가중치 조정이 가능한 구조로 구현되어 있다.
  - 집계 뷰 `public.profile_reputation`: 역할별(`as_seller`/`as_buyer`) 평균 별점·평가 수·완료 거래 수(`completed`/`auto_completed`)를 산출. `security_invoker=on`.
  - 임시 산정 함수 `public.calc_reputation_level(completed_count int, avg_score numeric)`:
    `level = 1 + floor(완료건수 / 5) + (평균별점 ≥ 9 → +2, ≥ 7 → +1, else 0)`.
    가중치 상수(거래 5건/별점 9·7 임계/보정 2·1)는 **정책 확정 시 본 함수만 교체**하면 된다(`search_path=''` 하드닝).
  - `profiles.seller_level`/`buyer_level` **캐시 컬럼** 재계산 동기화는 **T059에서 구현됨**: `submit_rating` RPC가 평가 직후 `profile_reputation` 역할별 평균·완료건수로 `calc_reputation_level`을 호출해 해당 레벨 컬럼을 UPDATE한다. 산정식(가중치/임계) 자체는 미결정이므로 본 이슈는 OPEN 유지(함수만 교체하면 반영됨).

## ISSUE-006 · 입찰 후 상품 내리기 제한 강도 🟢 DONE(패널티 후 허용)

- **배경**: 입찰 발생 후 상품 내리기는 제한한다(입찰 전에는 자유).
- **결정(확정, 사용자)**: **패널티 부과 후 허용** 으로 확정. 입찰이 없으면 자유롭게 내릴 수 있고(패널티 없음), **입찰이 1건이라도 있으면 내릴 수 있으나 패널티(`withdraw_with_bids`)가 기록**된다. 이 패널티는 ISSUE-004의 이용 제한 누적 대상이다.
- **반영**:
  - DB: `withdraw_product` RPC 재정의 — 기존 "입찰 있으면 차단(exception)"을 제거하고, 입찰 존재 시 `penalties(penalty_type='withdraw_with_bids')` insert 후 `status='withdrawn'`. 본인·active 상품 검증은 유지.
  - UI: `withdraw-product-button` 확인 다이얼로그 문구를 "입찰이 있으면 패널티 부과, 누적 시 등록 제한"으로 갱신.
- **검증**: 사용자 가장 롤백 테스트로 입찰 있는 상품 내림 시 `status=withdrawn` + `penalties` 1건(`withdraw_with_bids`) 기록 확인.

## ISSUE-007 · 연쇄 이양 시 차순위 수락 대기시간 🟢 DONE(즉시 이양 확정)

- **배경**: 낙찰 포기 시 차순위로 연쇄 이양된다.
- **결정(확정, 사용자)**: **즉시 이양** 으로 확정. 차순위 수락 대기시간은 두지 않는다. 낙찰 포기 즉시 차순위 입찰자에게 **그의 입찰가**로 낙찰이 이양되며 새 거래(pending)·채팅방이 생성된다. 차순위가 없으면 유찰(`failed`). 새 낙찰자는 동일한 포기 흐름을 다시 사용할 수 있다(연쇄).
- **반영**: `abandon_won_auction` RPC의 차순위 즉시 이양 로직 유지(변경 없음), 포기 패널티에 `penalty_type='abandon_won'` 명시(ISSUE-004 누적 대상). UI 안내 문구를 "즉시 이양 + 패널티 누적 시 등록 제한"으로 갱신.
- **검증**: 사용자 가장 롤백 테스트로 포기 시 차순위(그의 입찰가 2000)로 winner 교체·새 pending 거래·채팅방 생성·포기 패널티(`abandon_won`) 기록 확인.

## ISSUE-008 · 경매 자동 종료/자동완료 실행 메커니즘 🟢 DONE(pg_cron)

- **배경**: 36시간 만료 자동 낙찰, 거래 자동완료는 시점 도달 시 자동 실행이 필요하다.
- **결정(확정)**: **`pg_cron` + DB 함수(plpgsql)**. Edge Function/외부 스케줄러 미사용(인프라 최소화). 모든 정산 로직이 DB 트랜잭션 내에서 원자적으로 실행된다.
- **T054 구현(자동 종료)**: `pg_cron` 확장 활성화 + `public.close_expired_auctions()`(만료 active 경매를 낙찰 `won`/유찰 `failed` 처리, 낙찰 시 `_award_auction` 공통 함수로 거래·채팅방 생성). `cron.schedule('close-expired-auctions','* * * * *', ...)` 1분 주기 등록. `SECURITY DEFINER`+`search_path=''`, public/anon/authenticated EXECUTE 회수.
- **T058 구현(자동완료)**: `auto_complete_transactions()`가 동일 `pg_cron` 메커니즘을 재사용(대기시간은 DB 공통코드 `codes.policy.auto_complete_wait_hours`를 `get_policy_int`로 조회 — ISSUE-002). `cron.schedule('auto-complete-transactions','* * * * *', ...)` 1분 주기 등록.
- **완료 확인(2026-07-02)**: `cron.job`에 `close-expired-auctions`·`auto-complete-transactions` 2종 active. Edge Function/외부 스케줄러 미사용 확정 → DONE.

## ISSUE-009 · 모바일 헤더 메뉴 → 하단 BottomNav로 대체 🟢 DONE

- **배경**: `SiteHeader`는 데스크톱 네비게이션만 포함하여 모바일에서는 헤더에 네비게이션 링크가 표시되지 않는다.
- **해결(T033 확인)**: 루트 레이아웃의 하단 고정 `BottomNav`(홈/경매 등록/거래/프로필 탭바)가 모바일 내비게이션을 제공한다. 모바일(430px) 캡처에서 하단 탭바 정상 표시 확인. 햄버거 드로어는 불필요하여 도입하지 않는다.
- **참고**: 추후 검색/필터 등 메뉴 항목이 늘어나면 헤더 드로어(Shadcn Sheet) 재검토 가능(MVP 범위 외).

## ISSUE-010 · `lang` 속성 정책 (현재 "en") 🟢 DONE(ko 고정)

- **배경**: `app/layout.tsx`의 `<html lang="en">`이 영문으로 설정되어 있으나 알밤마켓은 한국어 서비스다.
- **해결(2026-07-02)**: `<html lang="ko">`로 변경. MVP는 한국어 단일 언어이므로 정적 고정한다.
- **향후**: 다국어(i18n) 도입 시 next-intl 등으로 `lang` 동적 처리 필요 — Phase 7(T074) 범위.

## ISSUE-011 · cacheComponents 동적 라우트 prerender Suspense 패턴 🟢 DONE

- **배경**: `next.config.ts`의 `cacheComponents: true` 환경에서 동적 라우트(`/auctions/[id]` 등)를 빌드하면 "Uncached data was accessed outside of `<Suspense>`" 오류로 `next build`가 실패했다.
- **원인**: 루트 레이아웃(`app/layout.tsx`)이 렌더하는 `BottomNav`가 `usePathname()`(요청 시점 데이터)을 사용하는데 Suspense 경계 밖에 있었다. 정적 라우트는 prerender 시 경로가 확정되어 통과하지만, 동적 파라미터 라우트에서는 `usePathname()`이 동적값이 되어 셸 prerender를 막는다.
- **해결(T012)**: ① 루트 레이아웃에서 `<BottomNav />`를 `<Suspense fallback={null}>`로 감쌈. ② 동적 페이지는 `params`를 Suspense 안의 async 자식에서 `await`하는 정석 패턴 적용(fallback은 non-null). 결과적으로 동적 라우트 3개가 Partial Prerender(◐)로 정상 빌드.
- **Phase 2 참고**: 동적 데이터(params/searchParams/cookies)를 읽는 컴포넌트는 반드시 Suspense 경계 안에 두고 fallback은 비우지 말 것.

## ISSUE-012 · 타입 네이밍 camelCase ↔ 실DB snake_case 매핑 🟢 DONE

- **배경**: 도메인 공용 타입(`lib/types/*`)의 필드 네이밍을 **camelCase로 확정**(사용자 선택). 반면 PRD/Supabase 컬럼은 snake_case다.
- **해결(Phase 5)**: 데이터 조회부에 전용 매핑 레이어 `lib/queries/_map.ts`(`toProduct`/`toAuctionSummary`/`toAuctionDetail` 등)를 두어 Supabase snake_case 응답을 camelCase 도메인 타입으로 일괄 변환한다. UI 컴포넌트는 camelCase 계약을 고정한 채 **무수정**으로 실데이터 전환됨(홈·상세 Playwright 검증 완료).
- **참고**: 매핑 비용 제거를 위해 타입을 snake_case로 재정의하는 대안이 있으나, camelCase 유지가 결정 사항이므로 매핑 레이어 방식으로 확정.

## ISSUE-014 · `profiles.nickname` NOT NULL 제약 🟢 DONE

- **배경**: 도메인 `Profile.nickname`은 필수 값이나, 스타터킷 `profiles`에는 기존 행이 있고 회원가입 폼이 `nickname` metadata를 전달하지 않아 NOT NULL을 연기했었다.
- **해결(2026-07-02)**:
  - 트리거 `handle_new_user()` 폴백 보강: `coalesce(nickname → full_name → 이메일 로컬파트 → '사용자_'+id 접두)`로 **어떤 가입 경로에서도 non-null 보장**(이메일 가입처럼 metadata가 없어도 안전).
  - 회원가입 폼(`components/sign-up-form.tsx`)에 **닉네임 입력 필드 추가** + `signUp options.data.nickname` 전달.
  - 잔여 NULL 방어 백필(당시 0건) 후 `ALTER TABLE profiles ALTER COLUMN nickname SET NOT NULL` 적용.
  - `generate_typescript_types` 재생성으로 `profiles.nickname: string`(non-null) 반영, `check-all` 통과.

> ISSUE-016 상세는 문서 하단 「ISSUE-016 · 평점 코멘트(comment) 미저장 🟢 DONE」으로 통합됨(중복 헤더 제거).

## ISSUE-017 · 미들웨어 비로그인 보호 경로 복원 🟢 DONE

- **배경**: `lib/supabase/proxy.ts`가 Phase 2 화면 우선 개발용으로 `/auctions`·`/transactions`·`/profile`·`/chat`을 비로그인 임시 허용하고 있었고(주석 "Phase 2 인증 연결 시 제거"), Phase 5 인증 연결 후에도 복원이 누락되어 보호 경로가 무방비 상태였다.
- **해결(T062, 사용자 승인)**: 화이트리스트(NOT startsWith) 방식을 명시적 보호경로 판정으로 전환. `isProtectedRoute = (pathname === "/auctions/new") || (pathname === "/profile") || startsWith("/transactions") || startsWith("/chat")`. 비로그인 시 `/auth/login` 리다이렉트.
- **정책 근거(PRD)**: 경매 등록·거래·채팅은 "로그인 필요", 경매 상세(`/auctions/[id]`)·타인 프로필(`/profile/[id]`)·홈·`/sample`은 공개 브라우징 허용.
- **세션 규칙 준수**: `createServerClient`~`getClaims` 사이는 미수정, `supabaseResponse` 반환 유지(CLAUDE.md). Playwright로 차단 4종·공개 2종 재검증 완료.

## ISSUE-018 · 스타터킷 잔재(groups) anon SECURITY DEFINER 노출 🟢 DONE

- **배경**: 스타터킷의 `groups`/`group_members` 테이블과 `handle_new_group`/`has_group_role`/`is_group_member`/`join_group_by_code` 함수가 남아 있고, advisor가 anon/authenticated의 SECURITY DEFINER 실행 가능을 WARN으로 보고했다.
- **해결(2026-07-02)**: 두 테이블 모두 0행·외부 참조 없음(도메인 정책/FK 무관) 확인 후 `DROP TABLE ... CASCADE`(트리거 `on_group_created` 포함) + `DROP FUNCTION` 4종. 보안 WARN 8건 소거.
  - 추가: `get_policy_int(text)`가 `PUBLIC` 기본 EXECUTE로 anon에도 노출되던 것을 `REVOKE ... FROM PUBLIC, anon` + `GRANT ... TO authenticated`로 정정(anon WARN 소거). `authenticated`는 `products.auction_ends_at` DEFAULT(=`get_policy_int(...)`) 평가에 필요하므로 유지.
- **남는 WARN(의도)**: 도메인 거래 RPC(place_bid/buy_now/complete_transaction/abandon_won_auction/withdraw_product/submit_rating)와 get_policy_int의 `authenticated` 실행은 내부 `auth.uid()` 검증/기능 의존이 있는 의도된 설계. (`auth_leaked_password_protection`은 Auth 대시보드 설정, 별개)

## ISSUE-019 · FK 커버링 인덱스 미생성 🟢 DONE

- **배경**: performance advisor(INFO)가 `chat_rooms(buyer_id/seller_id)`·`messages(sender_id)`·`penalties(user_id)`·`product_images(product_id)`·`products(winner_id)`·`ratings(rater_id)`·`transactions(product_id)` FK에 커버링 인덱스가 없다고 보고.
- **해결(2026-07-02)**: 도메인 FK 8건에 `idx_<table>_<column>` 커버링 인덱스 추가(`groups.created_by`는 ISSUE-018로 테이블째 제거되어 자동 소거). `unindexed_foreign_keys` advisor 0.
- **참고**: 갓 생성된 인덱스는 아직 쿼리에 안 쓰여 `unused_index`(INFO)로 뜨는 게 정상이며(데이터/트래픽 증가 시 사용됨), 이는 회귀가 아니다. 기존 `idx_products_seller_id`도 동일 사유의 INFO.

## ISSUE-013 · RSC에 이벤트 핸들러 전달 금지 🟢 DONE

- **배경**: Phase 2 T025에서 서버 컴포넌트(RSC)인 `transaction-card`의 버튼에 placeholder `onClick`을 전달하자 "Event handlers cannot be passed to Client Component props" 런타임 500 에러 발생.
- **원인**: React Server Component는 직렬화되어 클라이언트로 전달되므로 함수(이벤트 핸들러)를 props로 넘길 수 없다.
- **해결(T025)**: 정적 버튼은 `onClick` 없이 마크업만 두고(동작은 Phase 3), 입력·전송·모달 등 상호작용이 필요한 부분만 `'use client'` 컴포넌트로 분리.
- **Phase 3 참고**: 인터랙션 추가 시 해당 UI를 client 컴포넌트로 분리하거나 페이지/카드를 client로 전환할지 판단할 것. 표현 컴포넌트의 props 계약(데이터 only)은 유지.

## ISSUE-020 · 타인 프로필 `/profile/[id]` Mock 데이터 표시 🟢 DONE

- **배경**: 통합 회귀테스트(2026-06-29) 중 판매자 세션으로 구매자(`7d95810c…`, 닉네임 `쇼팽테스터11`)의 타인 프로필 페이지에 접근하니 실제 데이터가 아닌 **Mock 데이터(`김알밤`, 판매 Lv.3·8.2, 구매 Lv.2·8.0)** 가 표시됨.
- **원인**: `app/profile/[id]/page.tsx`가 아직 `getMockProfile`을 사용(실데이터 미전환). 내 프로필(`/profile`)·홈·상세 등 다른 화면은 모두 Supabase 실데이터로 동작.
- **해결(2026-06-29)**: `ProfileContent`의 조회부를 `getMockProfile/toSellerReputation` → `fetchProfile(id)` + `fetchProfileScores(id)`(`@/lib/queries`, 기존 함수 재사용)로 교체. 미존재 id는 `notFound()`로 404 처리. **UI 컴포넌트(`ProfileCard`)·읽기전용 구조는 무변경**(컴포넌트 무수정 원칙 준수). Playwright로 실데이터(`user_404087e6bbbbb`·서울·Lv.3) 표시 및 비존재 id 404 확인, `check-all` 통과.

## ISSUE-021 · 평점 제출 시 `submit_rating` 콘솔 400 관측 🟢 DONE(멱등 처리)

- **배경**: 회귀테스트에서 평점 제출 시 브라우저 콘솔에 `POST /rest/v1/rpc/submit_rating 400` 1건이 관측됨.
- **확인**: 양방향 평점은 `ratings`에 정상 저장(as_seller 9점/as_buyer 10점)되고 레벨도 재계산됨. postgres 로그에 `submit_rating` 관련 DB 에러 없음(데이터 무결성 영향 없음).
- **추정**: 모달 제출의 중복 호출/멱등성 또는 일시적 스키마 캐시 이슈. 재현 시 네트워크 요청을 캡처해 원인 규명 권장.
- **조사(2026-07-02)**: `rating-modal`에 이미 중복 제출 가드 존재 확인(제출 버튼 `disabled={selectedScore===0 || isSubmitting}` + 성공 후 `submitted` 뷰 전환) → 버튼 연타는 원인 아님. 남는 400은 ① **이미 평가된 거래 재제출**(`ratings` 거래당 1회 UNIQUE 위반) 또는 ② **ISSUE-016 마이그레이션 직후 PostgREST 스키마 캐시 일시 불일치**로 좁혀짐. 현재 스키마 캐시 warm 상태라 재현 불가. **데이터 무결성 영향 없음**으로 DEFER 유지.
- **해결(2026-07-02)**: `submit_rating`을 멱등 처리로 재정의(마이그레이션 `resolve_issue_021_submit_rating_idempotent`). 기존 `unique_violation → raise`(=REST 400)를 제거하고 `insert ... on conflict (transaction_id, rater_id) do nothing`으로 흡수, 실제 삽입된 경우(`if not found then return`)에만 평판 레벨을 재계산한다(중복 재제출은 부작용 없는 no-op). 권한(authenticated/service_role)·검증 로직 유지.
- **검증**: 사용자 가장 RAISE-to-rollback 테스트 — 동일 거래 2회 제출 시 2차가 예외 없이 통과, `ratings` 1건·최초 점수(8) 보존 확인(`cnt=1 score=8`). 재제출 콘솔 400 제거.

## ISSUE-015 · 상품 설명(description) 미저장 🟢 DONE

- **배경**: 경매 등록 폼의 `상품 설명`이 입력되나 `products`에 `description` 컬럼이 없어 미저장(SQL `column p.description does not exist`로 재확인, 2026-06-29).
- **해결**: `ALTER TABLE products ADD COLUMN description text`(nullable). 데이터 흐름 전 계층 배선 — `CreateAuctionInput.description`+insert(`lib/mutations/auctions.ts`), `auction-form` 제출 페이로드, `Product.description` 타입, `_map.ts`(`toProduct`/`toAuctionDetail`) 매퍼, 상세 표시(`auction-info`에 "상품 설명" 렌더 영역, 값 있을 때만). `check-all` 통과.

## ISSUE-016 · 평점 코멘트(comment) 미저장 🟢 DONE

- **배경**: 평점 모달에서 코멘트를 입력하나 `ratings`에 `comment` 컬럼이 없고 `submit_rating(p_transaction_id, p_score)`에도 인자가 없어 미저장(2026-06-29 재확인).
- **해결**: `ALTER TABLE ratings ADD COLUMN comment text`. `submit_rating`을 `(p_transaction_id, p_score, p_comment text default null)`로 재정의(insert에 comment 포함, 레벨 재계산 로직·권한(authenticated/service_role) 유지). `submitRating(transactionId, score, comment)` 뮤테이션, `rating-modal` 제출 배선(`comment.trim() || null`), `Rating.comment` 타입 반영. 롤백 테스트로 코멘트 저장 확인.

## ISSUE-022 · 고아 상품 이미지 → `/_next/image` 400 🟢 DONE(온에러 폴백)

- **배경**: 홈/상세에서 상품 카드 이미지가 `/_next/image?url=…supabase…/product-images/…/0.png`로 요청될 때 콘솔에 **400 Bad Request**가 관측됨(2026-07-02 미커밋 작업 빌드 검증 중 발견).
- **원인**: `next.config.ts`의 `images.remotePatterns`(Supabase 호스트 + `/storage/v1/object/public/**`)는 정상. 원본 Storage URL 자체가 400이며, `storage.objects`(bucket `product-images`)가 **0건**으로 확인됨. 즉 `product_images.url` 행은 존재하나 실제 업로드 파일이 없다(과거 로컬 이미지 삭제 커밋 `e299eab` + P6TEST 정리 잔재로 추정되는 고아 데이터). **코드/경로 생성 로직은 정상**(데이터 바인딩·매핑 검증 통과).
- **해결(2026-07-02)**: `ProductImage` 클라이언트 컴포넌트 신설(`components/common/product-image.tsx`) — `next/image` `onError` 시 `ImagePlaceholder`로 전환. `auction-card` 대표 이미지·`auction-gallery` 대표/썸네일에 적용해 로드 실패 시 깨진 아이콘 대신 그레이스풀 폴백. 신규 업로드 흐름은 실제 파일이 존재하므로 정상.
- **잔여(참고)**: onError는 UI를 폴백하지만 브라우저는 실패한 원본 요청을 여전히 네트워크 400으로 기록한다(이미지 바이너리 자체가 없기 때문). 현재 `product_images` 5행은 모두 고아 **테스트 데이터**이며, 콘솔 400까지 완전 제거하려면 고아 행 정리(선택)가 필요하다 — 신규 실업로드로 대체되면 자연 소멸.
