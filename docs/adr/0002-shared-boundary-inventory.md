# ADR-0002 · 공유 경계 인벤토리 & service_role 처리

- **상태**: 채택(Accepted) · 2026-07-04 · **service_role 격리 범위는 TS18에서 최종 확정(아래 ⚠️ 참조)**
- **관련 태스크**: TS02(본 문서) · TS06(이관) · TS11(공개앱 import 재작성) · TS18(시크릿 분리)
- **상위**: [`0001-shared-distribution-mechanism.md`](./0001-shared-distribution-mechanism.md), [`../division.md`](../division.md)

---

## 1. 이동 대상 → `@0625chopin/shared` (실측 파일)

| 영역                | 파일                                                                              | 수  | export subpath           |
| ------------------- | --------------------------------------------------------------------------------- | --- | ------------------------ |
| 도메인 타입         | `lib/types/{profile,bid,chat,penalty,transaction,common,product,rating,index}.ts` | 9   | `types`                  |
| DB 타입             | `lib/database.types.ts`                                                           | 1   | `database`               |
| Supabase 클라이언트 | `lib/supabase/{client,server,proxy,storage}.ts`                                   | 4   | `supabase/*`             |
| Supabase 특권       | `lib/supabase/admin.ts`                                                           | 1   | `supabase/admin` (⚠️ §3) |
| 포맷/유틸           | `lib/format.ts`, `lib/utils.ts`                                                   | 2   | `format`, `utils`        |
| 상수                | `lib/constants/auctions.ts`                                                       | 1   | `constants`              |
| 매퍼                | `lib/queries/_map.ts`                                                             | 1   | `queries/map`            |
| UI 프리미티브       | `components/ui/*`                                                                 | 17  | `ui/*`                   |
| 공용 표현           | `components/common/*`                                                             | 9   | `common/*`               |
| 디자인 토큰         | `app/globals.css`의 `@theme`/`:root`/`.dark`                                      | -   | `styles.css`             |

> **합계 이동 파일 약 45개 + 테마 CSS.** 이 표면이 두 앱의 "반드시 공유되어야 하는" 코드다.

## 2. 잔류 (각 앱 로컬)

- **도메인 조회/변경 (공개 앱 잔류)**: `lib/queries/{profiles,site,codes,index,auctions,penalties,chat,transactions}.ts`(8, `_map` 제외), `lib/mutations/{chat,profiles,auctions,transactions}.ts`(4).
  - ⚠️ `lib/queries/index.ts` barrel은 `_map`을 재수출하므로, 이관 후 `@0625chopin/shared/queries/map`에서 import하도록 수정(TS11).
- **레이아웃/페이지**: `components/layout/*`, `app/*`.
- **admin 앱**: admin 전용 조회/변경(admin RPC)·타입·컴포넌트·사이드바 셸은 **admin 레포에서 신규**(shared 아님).
- **근거**: `queries/mutations`는 RLS 스코프의 사용자 컨텍스트에 종속 → 앱별로 다름. 공유는 **순수 매퍼 `_map`만**.

## 3. ⚠️ `lib/supabase/admin.ts`(service_role) 처리 — 중요 발견

**방침**: `admin.ts`는 shared에 두되 `SUPABASE_SERVICE_ROLE_KEY` 부재 시 throw(현행 유지), export subpath `supabase/admin`.

**그러나 실측 결과, `createAdminClient`는 현재 "공개 앱"이 사용 중이다** (grep 전수, docs 제외):

| 사용처(공개 앱)                                  | 목적                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| `app/api/auth/otp/request/route.ts:53`           | 커스텀 OTP 발급(email_verifications insert, RLS 우회) |
| `app/api/auth/otp/verify/route.ts:37`            | OTP 검증·사용자 조회                                  |
| `app/api/auth/otp/resend/route.ts:32`            | OTP 재발송                                            |
| `app/api/auth/check-availability/route.ts:39,67` | 닉네임/이메일 중복 확인(RLS 우회)                     |

즉 **공개 앱은 커스텀 회원가입(OTP)·중복확인 때문에 service_role이 이미 필요**하다. 이는
"`SUPABASE_SERVICE_ROLE_KEY`는 admin에만"(TS18/division §3-6) 방침과 **정면 충돌**한다.

### 해소 옵션 (→ TS18에서 사용자 확정)

- **옵션 A (현실 수용, 권장 기본값)**: 공개 앱도 **자체 service_role**을 유지(OTP/availability 전용).
  "격리"의 의미를 "admin 강제·제재 특권 로직이 공개 배포에 없음"으로 재정의. 두 배포 모두 service_role을
  갖되 **용도가 분리**됨. 가장 적은 변경.
- **옵션 B (완전 격리)**: 공개 앱의 OTP/availability를 **Supabase Edge Function 또는 RPC로 이전**해
  공개 프론트에서 service_role을 완전히 제거. 보안상 가장 깔끔하나 **신규 백엔드 작업**(범위↑).
- **옵션 C**: 해당 OTP 라우트를 admin 도메인/별도 서비스로 이관 — UX 흐름상 부적절(회원가입은 공개 앱 기능)이라 비권장.

> **현재 가정**: 옵션 A. `admin.ts`는 shared 공유(양 앱 import 가능), **격리 대상은 "관리자 콘솔의
> 강제/제재 admin RPC 호출부"**로 한정. TS18에서 확정.

## 4. `createAdminClient` grep 결과 (원본, docs 제외)

```
lib/supabase/admin.ts:12                    export function createAdminClient() {   ← 정의
app/api/auth/otp/request/route.ts:2,53      import + 호출
app/api/auth/otp/verify/route.ts:2,37       import + 호출
app/api/auth/otp/resend/route.ts:2,32       import + 호출
app/api/auth/check-availability/route.ts:2,39,67  import + 2회 호출
```

## 5. 검증 대응(완료 기준)

- ✅ 이동/잔류 파일 목록 확정(§1, §2, 실측 glob 기반).
- ✅ `admin.ts` 처리 방침 명문화(§3).
- ✅ `createAdminClient` 사용처 grep 결과 첨부(§4) — **공개 앱 4개 라우트 사용 발견**, TS18 결정으로 연결.
