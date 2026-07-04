# ADR-0004 · 버전 핀 정책 (3레포 정합)

- **상태**: 채택(Accepted) · 2026-07-04
- **관련 태스크**: TS04(본 문서) · TS05(shared peerDeps) · TS13/TS14(공개앱·admin 핀 적용)
- **상위**: [`../division.md`](../division.md)

---

## 1. 문제

현재 공개 앱 `package.json`은 `next`·`@supabase/ssr`·`@supabase/supabase-js`를 **`latest`**로 둔다.
3개 레포(공개앱·`@0625chopin/shared`·admin)가 `latest`를 쓰면 설치 시점마다 버전이 달라져 **버전 스큐**가
발생하고, 특히 `cacheComponents`(Next 신기능)·React 19·Tailwind v4의 미세 버전 차이가 런타임/빌드
오류로 이어질 수 있다. → **정확 버전 핀**으로 통일한다.

## 2. 정확 버전표 (현재 lock 기준 — `package-lock.json` 실측)

| 패키지                  | 정확 버전   | 3레포 역할                                         |
| ----------------------- | ----------- | -------------------------------------------------- |
| `next`                  | **16.2.9**  | 앱 dependency (공개·admin). `cacheComponents` 사용 |
| `react`                 | **19.2.7**  | 앱 dependency + shared **peerDependency**          |
| `react-dom`             | **19.2.7**  | 앱 dependency + shared **peerDependency**          |
| `tailwindcss`           | **4.3.2**   | 앱 devDependency + shared **peerDependency**       |
| `@tailwindcss/postcss`  | **4.3.2**   | 앱 devDependency (공개·admin)                      |
| `@supabase/ssr`         | **0.12.0**  | 앱 + shared **peerDependency**                     |
| `@supabase/supabase-js` | **2.108.2** | 앱 + shared **peerDependency**                     |
| `next-themes`           | **0.4.6**   | 앱 dependency                                      |
| `lucide-react`          | **0.511.0** | shared dependency(아이콘)                          |

### shared 자체 dependencies (UI 프리미티브가 사용, shared가 번들/의존)

| 패키지                          | 버전(현재 package.json range) |
| ------------------------------- | ----------------------------- |
| `class-variance-authority`      | `^0.7.1`                      |
| `clsx`                          | `^2.1.1`                      |
| `tailwind-merge`                | `^3.3.0`                      |
| `tw-animate-css`                | `^1.4.0`                      |
| `radix-ui`                      | `^1.6.0`                      |
| `@radix-ui/react-checkbox`      | `^1.3.1`                      |
| `@radix-ui/react-dropdown-menu` | `^2.1.14`                     |
| `@radix-ui/react-label`         | `^2.1.6`                      |
| `@radix-ui/react-slot`          | `^1.2.2`                      |

## 3. 정책

1. **`latest` 제거**: 공개 앱의 `next`·`@supabase/ssr`·`@supabase/supabase-js`를 §2 정확 버전으로 교체.
   admin 레포도 동일 정확 버전으로 생성(TS14). (적용은 공개앱 TS13, admin TS14 — 본 태스크는 정책 확정.)
2. **3레포 프레임워크/백엔드 버전 일치**: `next` 16.2.9, `react`/`react-dom` 19.2.7, `tailwindcss` 4.3.2,
   `@supabase/ssr` 0.12.0, `@supabase/supabase-js` 2.108.2를 공개앱·admin이 동일하게 핀.
3. **shared는 peerDependencies**: `react`, `react-dom`, `tailwindcss`, `@supabase/ssr`,
   `@supabase/supabase-js`를 shared의 **peerDependencies**로 선언(중복 번들·React 인스턴스 충돌·버전
   스큐 방지). shared 자체 UI 의존(radix/cva/clsx/tailwind-merge/tw-animate-css/lucide-react)은
   shared **dependencies**.
4. **업그레이드 절차**: 프레임워크 버전 상향은 3레포를 **동시에** 올린다(shared peer range 갱신 →
   공개앱·admin 동시 핀). 단독 상향 금지(스큐 방지).
5. **lockfile 커밋**: 세 레포 모두 `package-lock.json` 커밋으로 재현 설치 보장.

## 4. 비고

- 현재 `next`가 `latest`→**16.2.9**로 해석됨(문서상 "canary" 표현보다 실제는 16.2.x 릴리스).
  `cacheComponents`가 이 버전에서 동작 중이므로 이 정확 버전을 기준으로 고정한다.
- Tailwind v4는 CSS-first(`@theme`)이며 `tailwind.config.ts` 부재 — shared `styles.css`(TS07)가
  토큰 단일 소스, 소비 앱은 `@source`로 패키지 클래스 스캔.

## 5. 검증 대응(완료 기준)

- ✅ 정확 버전표 작성(§2, lock 실측).
- ✅ `latest` 제거 방침 명문화(§3-1).
- ✅ peerDependencies 방침 기록(§3-3).
