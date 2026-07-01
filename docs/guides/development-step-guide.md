# 개발 단계 가이드 (Development Step Guide)

이 문서는 본 프로젝트에서 화면(UI)을 먼저 완성하고 데이터를 나중에 연결하는 **화면 우선 개발(Mock First Development)** 방식을 9단계로 정리한 실무 가이드입니다. 또한 한국어/영어/일본어 **다국어(i18n) 처리** 전략을 포함합니다.

> 전제: 이 프로젝트는 Next.js(App Router) + Supabase(`@supabase/ssr`) 스타터킷입니다. 폴더 구조는 `src/` 없이 루트에 `app/`, `components/`, `lib/`가 위치하며, TailwindCSS v3.4.1 + shadcn/ui를 사용합니다. 자세한 아키텍처는 루트 `CLAUDE.md`를 참고하세요.

---

## 🎯 핵심 원칙: 화면 우선 개발 (Mock First)

1. **모든 화면은 컴포넌트 단위**로 만듭니다.
2. 모든 컴포넌트는 `https://localhost:3000/sample` 에 보이도록 배치해 한곳에서 확인합니다.
3. **더미 데이터(Mock Data)로 UI부터** 구현합니다.
4. Database 설계/연결 **전에** 화면·컴포넌트 구조·UX를 먼저 완성합니다.
5. Mock 데이터와 실제 DB 데이터는 **동일한 TypeScript 타입**을 사용합니다.
6. 실데이터 전환 시 **UI 컴포넌트는 수정하지 않고 데이터 조회 부분만 교체**할 수 있도록 설계합니다.

이 원칙은 "데이터 계층과 표현 계층의 분리"로 요약됩니다. 타입을 먼저 고정하면, 나중에 Mock → Supabase로 데이터 소스만 갈아 끼울 수 있습니다.

---

## 📋 권장 개발 순서 (9단계)

### 1단계 · 프로젝트 개요 파악 및 주요 컴포넌트 설계

- 전체 프로젝트 요구사항/PRD를 훑어보고 **화면 목록**과 **공통 컴포넌트**를 도출합니다.
- 각 화면을 구성할 컴포넌트를 식별하고 재사용 단위로 쪼갭니다.
- 도메인 **타입을 먼저 정의**합니다. 이 타입이 Mock과 실데이터를 잇는 계약(contract)입니다.

```typescript
// lib/types/post.ts — Mock과 실제 DB가 공유하는 단일 타입
export interface Post {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string; // ISO 8601
}
```

> ✅ 산출물: 화면 목록, 컴포넌트 트리, 핵심 도메인 타입 정의

---

### 2단계 · 프로젝트 메뉴/네비게이터/골격 생성

- 라우트 골격을 잡습니다. App Router 기준으로 페이지/레이아웃을 스캐폴딩합니다.
- 전역 네비게이션(헤더/사이드바/푸터)과 레이아웃을 구성합니다.
- 빈 페이지라도 라우트가 연결되도록 만들어 **이동 흐름**을 먼저 검증합니다.

```
app/
├── layout.tsx          # 루트 레이아웃 (ThemeProvider, 전역 네비)
├── page.tsx            # 홈
├── sample/page.tsx     # 🧪 모든 컴포넌트 전시장
└── (도메인)/page.tsx   # 기능별 페이지 골격
```

> ✅ 산출물: 라우트 골격, 전역 레이아웃, 네비게이션, `/sample` 페이지 셸

---

### 3단계 · Mock 데이터로 UI 및 컴포넌트 개발

- 1단계에서 정의한 타입에 맞춰 **Mock 데이터**를 작성합니다.
- 컴포넌트는 데이터를 **props로만 받는 순수 표현 컴포넌트**로 만듭니다 (데이터 조회 로직을 컴포넌트 안에 넣지 않음).
- 완성한 컴포넌트는 모두 `/sample` 페이지에 배치합니다.

```typescript
// lib/mocks/posts.ts
import type { Post } from "@/lib/types/post";

export const mockPosts: Post[] = [
  {
    id: "1",
    title: "첫 번째 글",
    content: "Mock 데이터입니다.",
    authorName: "홍길동",
    createdAt: "2026-01-01T09:00:00Z",
  },
];
```

```tsx
// components/post/post-card.tsx — props만 받는 순수 컴포넌트
import type { Post } from "@/lib/types/post";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-lg border p-4">
      <h3 className="font-semibold">{post.title}</h3>
      <p className="text-sm text-muted-foreground">{post.authorName}</p>
    </article>
  );
}
```

> ✅ 산출물: Mock 데이터, 순수 표현 컴포넌트, `/sample` 전시

---

### 4단계 · Loading / Empty / Error 상태 구현

데이터 화면은 **정상 상태만으로 끝나지 않습니다.** 세 가지 상태를 반드시 구현합니다.

- **Loading**: 스켈레톤/스피너. App Router의 `loading.tsx` 또는 `<Suspense>`를 활용.
- **Empty**: 데이터가 0건일 때의 안내 화면 (행동 유도 버튼 포함).
- **Error**: 실패 시 메시지 + 재시도. App Router의 `error.tsx`(Client Component) 활용.

```tsx
// 상태별 분기 예시
if (isLoading) return <PostListSkeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (posts.length === 0) return <EmptyState />;
return <PostList posts={posts} />;
```

> ✅ 산출물: 각 화면의 Loading/Empty/Error 컴포넌트. `/sample`에서 상태별로 토글 확인

---

### 5단계 · 사용자 인터랙션 및 화면 검증

- 폼 입력, 모달, 필터, 페이지네이션 등 **클라이언트 인터랙션**을 구현합니다.
  - 이 프로젝트의 폼은 `useState` + Supabase 클라이언트 직접 호출 패턴입니다 (Server Action 미사용).
- 반응형(모바일/데스크톱), 다크모드, 접근성(키보드/포커스)을 점검합니다.
- 필요 시 Playwright MCP로 화면을 캡처/검증합니다.

> ✅ 산출물: 동작하는 인터랙션, 반응형·다크모드 검증 완료. **여기까지가 "화면 완성" 단계**입니다.

---

### 6단계 · Supabase Database 설계 및 생성

화면이 완성되면 비로소 DB를 설계합니다. 화면에서 실제로 쓰인 데이터 형태가 곧 스키마의 근거가 됩니다.

- 1단계의 도메인 타입을 기준으로 테이블/컬럼을 설계합니다.
- Supabase MCP 도구로 작업합니다.
  - `list_tables`로 기존 구조 확인 → `apply_migration`으로 마이그레이션 적용.
- 스키마 변경 후 `generate_typescript_types`로 `lib/database.types.ts`를 재생성합니다.

```sql
-- 예시 마이그레이션
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);
```

> ✅ 산출물: 테이블 스키마, 마이그레이션, 재생성된 `database.types.ts`

---

### 7단계 · RLS 정책 및 인증 연동

- 모든 테이블에 **RLS(Row Level Security)를 활성화**하고 정책을 정의합니다.
- 컨텍스트별 Supabase 클라이언트를 올바르게 사용합니다 (`CLAUDE.md` 참고).
  - 브라우저: `lib/supabase/client.ts`
  - Server Component/Action/Route Handler: `lib/supabase/server.ts` (`await createClient()`)
  - 미들웨어: `lib/supabase/proxy.ts`
- `get_advisors`로 보안 권고사항을 점검합니다.

```sql
alter table public.posts enable row level security;

create policy "본인 글만 수정" on public.posts
  for update using (auth.uid() = author_id);
```

> ✅ 산출물: RLS 정책, 인증 연동, 보안 advisor 점검 통과

---

### 8단계 · Mock 데이터를 실제 Database 데이터로 교체

화면 우선 개발의 결실을 거두는 단계입니다. **UI 컴포넌트는 손대지 않고** 데이터 조회 부분만 교체합니다.

```tsx
// Before — Mock
import { mockPosts } from "@/lib/mocks/posts";
const posts = mockPosts;

// After — Supabase (Server Component)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const { data: posts } = await supabase.from("posts").select("*");

// PostCard, PostList 등 표현 컴포넌트는 그대로 — 타입이 동일하므로 무수정
```

> ✅ 핵심: 데이터 소스만 바뀌고 컴포넌트는 불변. 동일 타입을 공유했기 때문에 가능합니다.

---

### 9단계 · CRUD 및 실데이터 통합 테스트

- 생성/조회/수정/삭제(CRUD) 전체 흐름을 실제 데이터로 검증합니다.
- 인증(로그인 사용자/비로그인)과 **권한(RLS)** 시나리오를 테스트합니다.
- `npm run check-all`(lint + format:check + typecheck)로 코드 품질을 확인합니다.
- 커밋 시 Husky pre-commit 훅이 lint-staged → 타입체크를 자동 실행합니다.

> ✅ 산출물: 통과한 CRUD/권한 통합 테스트, 품질 검사 통과

---

## 🌐 다국어 처리 (i18n)

지원 언어: **한국어(ko) · 영어(en) · 일본어(ja)**

### 기본 원칙

1. **모든 표시 문자열은 하드코딩하지 않고 번역 키로 관리**합니다.
2. UI를 만드는 3단계부터 한국어 텍스트 대신 번역 키를 사용하기 시작합니다.
3. 번역 리소스는 **언어별 JSON 파일**로 분리합니다.
4. 날짜·숫자·통화는 `Intl` API로 로케일에 맞춰 포맷합니다.

> 현재 프로젝트에는 i18n 라이브러리가 설치되어 있지 않습니다. App Router 환경에서는 **`next-intl`** 도입을 권장합니다. (설치: `npm i next-intl`) 아래는 도입을 전제로 한 권장 구조입니다.

### 번역 리소스 구조

```
messages/
├── ko.json   # 한국어
├── en.json   # 영어
└── ja.json   # 일본어
```

```json
// messages/ko.json
{
  "post": { "title": "게시글", "empty": "게시글이 없습니다." }
}
```

```json
// messages/en.json
{
  "post": { "title": "Posts", "empty": "No posts found." }
}
```

```json
// messages/ja.json
{
  "post": { "title": "投稿", "empty": "投稿がありません。" }
}
```

### 컴포넌트에서 사용

```tsx
// next-intl 사용 예시
import { useTranslations } from "next-intl";

export function PostHeader() {
  const t = useTranslations("post");
  return <h1>{t("title")}</h1>;
}
```

### 날짜/숫자 로케일 포맷

```typescript
// 로케일에 맞춘 날짜 포맷 — 키 번역과 별개로 Intl로 처리
new Intl.DateTimeFormat("ja", { dateStyle: "long" }).format(new Date());
// ko → "2026년 1월 1일" / en → "January 1, 2026" / ja → "2026年1月1日"
```

### 번역 작업 체크리스트

- [ ] 새 문자열을 추가할 때 `ko.json`·`en.json`·`ja.json` **세 파일을 동시에** 갱신합니다.
- [ ] 키 누락 시 fallback(기본 언어) 동작을 확인합니다.
- [ ] 일본어/영어는 **텍스트 길이가 달라** 레이아웃이 깨지지 않는지 `/sample`에서 점검합니다.
- [ ] 줄바꿈·말줄임(ellipsis)이 언어별로 자연스러운지 확인합니다.

---

## ✅ 단계별 완료 기준 요약

| 단계 | 핵심 작업                    | 완료 기준                          |
| ---- | ---------------------------- | ---------------------------------- |
| 1    | 개요 파악·컴포넌트/타입 설계 | 화면 목록·도메인 타입 확정         |
| 2    | 메뉴·네비·골격               | 라우트 이동 흐름 동작              |
| 3    | Mock UI 개발                 | `/sample`에 컴포넌트 전시          |
| 4    | Loading/Empty/Error          | 세 상태 모두 구현                  |
| 5    | 인터랙션·검증                | 반응형·다크모드 OK (**화면 완성**) |
| 6    | DB 설계                      | 마이그레이션·타입 재생성           |
| 7    | RLS·인증                     | 정책 적용·advisor 통과             |
| 8    | 실데이터 교체                | 컴포넌트 무수정 데이터 전환        |
| 9    | 통합 테스트                  | CRUD·권한·`check-all` 통과         |

---

## 📚 관련 문서

- `CLAUDE.md` — 프로젝트 아키텍처·개발 원칙 (최우선 기준)
- `docs/guides/project-structure.md` — 폴더 구조
- `docs/guides/component-patterns.md` — 컴포넌트 패턴
- `docs/guides/styling-guide.md` — 스타일링

> ⚠️ 참고: `docs/guides/`의 일부 문서는 이상적 설정을 서술하여 실제 저장소 구성과 다를 수 있습니다 (`src/` 구조, Tailwind v4 등). 충돌 시 **실제 코드와 `CLAUDE.md`를 기준**으로 삼으세요.
