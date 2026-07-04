# ADR-0001 · 공유층 배포 메커니즘 — `@0625chopin/shared`

- **상태**: 채택(Accepted) · 2026-07-04
- **맥락 문서**: [`../division.md`](../division.md), [`../PRD_ADMIN.md`](../PRD_ADMIN.md), [`../ROADMAP_ADMIN.md`](../ROADMAP_ADMIN.md)
- **관련 태스크**: TS01(본 ADR) · TS02(경계 인벤토리) · TS05/TS06(스캐폴드/이관) · TS09(발행) · TS20(타입 동기화)

---

## Context (배경)

알밤마켓 관리자 콘솔을 일반 사이트와 **완전 별도 레포**로 분리한다(보안 격리·독립 배포·운영 편의).
그런데 두 프론트엔드 앱은 다음을 **반드시 공유**해야 한다.

- `lib/types/*`, `lib/database.types.ts`(Supabase 재생성물)
- `lib/supabase/{client,server,proxy,storage,admin}.ts`
- `lib/{format,utils,constants}`, `lib/queries/_map.ts`
- `components/ui/*`(17, shadcn new-york), `components/common/*`(9)
- Tailwind v4 `@theme` 디자인 토큰(`app/globals.css`)

프로젝트 핵심 원칙이 **"Mock↔실DB 단일 타입 계약"**이므로, 물리적으로 분리된 두 레포가 이 공유
코드(특히 타입·db 타입)를 **어떻게 일관되게 공유**하느냐가 분리의 최대 리스크다.

## Decision (결정)

공유층을 **private npm 패키지 `@0625chopin/shared`(GitHub Packages 레지스트리)**로 배포하고, 공개 앱과
admin 앱이 각각 이를 **버전 의존성**으로 소비한다.

### 패키지 경계 — subpath exports

`@0625chopin/shared`는 다음 subpath를 export 한다(패키지 `exports` map).

| Export                                | 내용                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `@0625chopin/shared/types`            | 도메인 타입(`lib/types/*` barrel)                      |
| `@0625chopin/shared/database`         | `database.types.ts`(Supabase 생성 타입, **단일 소스**) |
| `@0625chopin/shared/supabase/client`  | 브라우저 클라이언트                                    |
| `@0625chopin/shared/supabase/server`  | SSR/쿠키 클라이언트                                    |
| `@0625chopin/shared/supabase/proxy`   | 미들웨어 `updateSession` 패턴                          |
| `@0625chopin/shared/supabase/storage` | Storage 유틸                                           |
| `@0625chopin/shared/format`           | 포맷 유틸                                              |
| `@0625chopin/shared/utils`            | `cn`, `hasEnvVars` 등                                  |
| `@0625chopin/shared/constants`        | 도메인 상수                                            |
| `@0625chopin/shared/queries/map`      | snake↔camel 매퍼(`_map.ts`)                            |
| `@0625chopin/shared/ui/*`             | shadcn UI 프리미티브(17)                               |
| `@0625chopin/shared/common/*`         | 공용 표현 컴포넌트(9)                                  |
| `@0625chopin/shared/styles.css`       | Tailwind v4 `@theme` 디자인 토큰(단일 디자인 소스)     |

> `lib/supabase/admin.ts`(service_role)는 shared에 포함하되, **키 부재 시 throw**하고 **공개 앱은
> import하지 않는다**(보안 격리). 경계 세부는 TS02에서 확정.

- `react`, `react-dom`, `tailwindcss`, `@supabase/*`는 **peerDependencies**(중복 번들·버전 스큐 방지).
- 클라이언트 컴포넌트는 `"use client"` 지시문을 산출물에 **보존**한다(TS08 검증).

## Rationale (근거 — 왜 npm 패키지인가)

1. **독립 배포 결정성**: 각 앱이 lockfile로 공유층의 **정확한 버전을 핀**한다. "어느 커밋의 공유층이
   이 배포에 들어갔나?"가 항상 명확 → 서브모듈 특유의 포인터 드리프트가 원천 차단.
2. **의도된 변경**: semver + 발행이 공유층 변경을 **명시적 릴리스**로 만든다. 무심코 양쪽이 어긋나지 않음.
3. **도구 정합**: Next `transpilePackages`, Tailwind v4 `@source`와 자연스럽게 맞물림.
4. **db 타입 단일 소스**: `database.types.ts`가 오직 shared에만 존재 → 타입 계약이 물리적으로 하나.

## Alternatives Considered (대안)

- **git submodule**: 공유층을 서브모듈로 두 레포에 링크.
  - 장점: 발행/버전 관리 불필요, 변경 즉시 전파 가능.
  - 단점: **포인터 드리프트**(각 레포가 서로 다른 서브모듈 커밋을 가리킴), Detached HEAD/커밋 누락
    실수, CI/배포에서 서브모듈 체크아웃 관리 부담. 배포 결정성이 npm 대비 약함.
  - 판단: **비채택**. 단, 아래 "전환 조건"에 해당하면 재검토.
- **코드 복제(수동 동기화)**: **비채택**(드리프트 위험 최대, 단일 타입 계약 원칙 정면 위배).

### 서브모듈 전환 조건 (재검토 트리거)

1인 개발 맥락에서 **bump→publish→양쪽 `npm update` 루프의 마찰**이 과도하다고 판명되고(예: db 타입
재생성이 잦아 발행 오버헤드가 개발 속도를 저해), 자동화(TS09 Actions + 릴리스 스크립트)로도 완화가
부족할 경우 → git submodule로 전환한다(포인터 드리프트 리스크를 감수).

## Drift Prevention (드리프트 방지책)

1. **단일 소스**: 공유 코드·db 타입은 `@0625chopin/shared`가 유일 소유. 앱 레포에 중복 사본 금지(TS11 grep 게이트).
2. **정확 버전 핀**: 양 앱의 lockfile로 shared 버전을 고정. `latest` 미사용(TS04).
3. **발행 자동화**: GitHub Actions `push main → version → publish`(TS09)로 발행 마찰 최소화.
4. **타입 재생성 파이프라인**: 원격 `apply_migration` → `generate_typescript_types` → shared 반영 →
   bump/publish → 양 레포 `npm update`. 마이그레이션 소유 = admin 레포(TS20).
5. **CI diff 감시**: shared CI가 예약으로 `supabase gen types` 재생성 후 `git diff --exit-code`로
   원격 스키마와의 불일치를 알림(TS20).

## Consequences (영향)

- (+) 배포 결정성·타입 단일 계약 유지·명시적 릴리스.
- (−) db 타입 재생성마다 bump→publish→`npm update` 루프(솔로 개발 마찰) → TS09 자동화로 완화.
- (−) GitHub Packages 인증(발행 `packages:write`, 소비 `read:packages` 토큰) 설정 필요 → TS09/TS18.
- 후속: TS05(스캐폴드)·TS06(이관)·TS09(발행)·TS20(동기화)가 본 결정을 구현.
