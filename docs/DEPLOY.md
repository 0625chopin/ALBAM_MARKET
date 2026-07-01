# 알밤마켓 — Vercel 배포 가이드 (Supabase 기존 프로젝트 재사용)

## 개요

이 프로젝트는 **Next.js 16 App Router + Supabase(클라우드)** 스택이며, Supabase DB/Storage/RLS/RPC는 이미 원격 프로젝트(`zmeyfvfkqnemnzafpzmn`)에 구성돼 동작 중입니다. 따라서 배포 작업은 **DB 마이그레이션 없이 프런트엔드(Next.js)를 Vercel에 올려 기존 Supabase에 연결**하는 것이 목표입니다.

현황 요약:

- GitHub 원격 연결됨: `https://github.com/0625chopin/ALBAM_MARKET.git` → **GitHub 연동 배포** 사용
- `.env.local`은 `.gitignore`(`.env*.local`)로 **git 미추적** → 시크릿 안전. 단 Vercel에 환경변수를 **수동 등록** 필요
- `package-lock.json`에 **Next 16.2.9(stable) 고정** → Vercel은 lockfile 기준 설치하므로 `"next":"latest"`여도 재현성 확보. `cacheComponents`/`proxy.ts`는 Next 16에서 지원됨(빌드 시 `ƒ Proxy (Middleware)`로 인식 확인)
- 사용 환경변수는 단 2개: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`.env.local`의 `NOTION_API_KEY`는 코드 미사용 → **등록 불필요**)

---

## 배포 단계

### 0. 사전 점검 (로컬)

1. 로컬 프로덕션 빌드 통과 확인 — Vercel과 동일 조건에서 미리 실패를 잡습니다.
   ```bash
   npm run build
   ```
2. `package-lock.json` 커밋 여부 확인 (재현성 핵심). 미커밋이면 커밋.
3. 최신 코드를 GitHub `main`에 push.
   ```bash
   git push origin main
   ```

### 1. Vercel에 프로젝트 Import

1. https://vercel.com → 로그인(GitHub 계정 권장) → **Add New… → Project**.
2. `0625chopin/ALBAM_MARKET` 저장소 선택 → **Import**.
3. Framework Preset이 **Next.js**로 자동 감지되는지 확인. Build/Output 설정은 기본값 유지 (`vercel.json` 불필요, `next build` 자동).
4. **아직 Deploy 누르지 말고** 아래 2단계(환경변수)를 먼저 설정.

### 2. 환경변수 등록 (필수 — 누락 시 조용히 실패)

Import 화면의 **Environment Variables** 섹션(또는 Project → Settings → Environment Variables)에서 아래 2개를 추가:

| Key                                    | Value                                                          | 대상 환경                        |
| -------------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `.env.local`의 값 (`https://zmeyfvfkqnemnzafpzmn.supabase.co`) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local`의 `sb_publishable_...` 값                         | Production, Preview, Development |

> **왜 중요한가 (근거):**
>
> - `lib/utils.ts`의 `hasEnvVars`가 두 변수를 검사 → 없으면 `lib/supabase/proxy.ts`가 인증 미들웨어를 **조용히 no-op** 처리(에러 없이 인증 무력화).
> - `next.config.ts`가 **빌드 시점**에 `NEXT_PUBLIC_SUPABASE_URL`로 `images.remotePatterns`를 계산 → 빌드 때 없으면 Storage 이미지가 `next/image`에서 전부 차단됨. 따라서 반드시 **Build 타임에도 주입**되도록 위 표의 모든 환경에 등록.
> - `NEXT_PUBLIC_` 접두사라 클라이언트 번들에 노출되지만, 이는 publishable(공개용) 키이므로 정상. RLS로 보호됨.

### 3. Deploy 실행 & 빌드 로그 확인

1. **Deploy** 클릭.
2. 빌드 로그에서 `next build` 성공, 미들웨어(`proxy.ts`) 인식 여부 확인.
3. 배포 완료 후 임시 도메인(예: `albam-market-xxxx.vercel.app`) 확보.

### 4. Supabase 인증 URL 설정 (로그인/이메일 확인 정상화)

배포 도메인이 정해지면 Supabase 대시보드에서 인증 리다이렉트를 등록해야 이메일 확인·비밀번호 재설정·OAuth 콜백이 프로덕션에서 동작합니다.

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://<배포도메인>` (예: `https://albam-market-xxxx.vercel.app`, 커스텀 도메인이 있으면 그 도메인)
- **Redirect URLs**에 추가:
  - `https://<배포도메인>/**` (와일드카드로 auth/confirm, auth/callback 등 커버)
  - Preview 배포도 쓸 거면 `https://*.vercel.app/**` 도 추가 고려

> **근거:** `app/auth/confirm/route.ts`(이메일 OTP `verifyOtp`), `app/auth/callback/route.ts`가 리다이렉트를 수행하고, 이메일 링크는 Supabase Site URL을 기준으로 생성됨. 로컬 `localhost:3000`만 등록돼 있으면 프로덕션에서 확인 메일 링크가 깨집니다.

### 5. 배포 후 엔드투엔드 검증

프로덕션 도메인에서 실제 동작 확인:

1. **인증**: `/auth/sign-up` 회원가입 → 확인 메일 링크 클릭 → 정상 로그인. 미로그인 상태로 `/auctions/new` 접근 시 `/auth/login`으로 리다이렉트되는지(미들웨어 동작 증거).
   - 또는 기존 테스트 계정 `0625chopin / qwer1234`로 로그인.
2. **이미지 표시**: 기존 경매 목록/상세에서 Supabase Storage 이미지(`/storage/v1/object/public/...`)가 `next/image`로 정상 로드되는지 → 2단계 env가 빌드 타임에 잘 들어갔는지 검증.
3. **경매 등록(쓰기+RLS+Storage)**: `/auctions/new`에서 이미지 첨부 후 등록 → 상세로 이동. `products` insert(RLS `seller_id=auth.uid()`), `product-images` 업로드, `product_images` insert가 프로덕션에서 통과하는지 확인.

---

## 주의사항 / 트러블슈팅

- **이미지가 안 뜬다 / `next/image` hostname 에러**: 2단계 env가 빌드 타임에 누락됐을 가능성 → 변수 확인 후 **Redeploy**(재빌드 필요, 런타임 변경만으로는 remotePatterns 반영 안 됨).
- **로그인이 풀리거나 보호 페이지가 안 막힌다**: env 누락으로 `hasEnvVars=false` → 미들웨어 no-op. 변수 등록 후 재배포.
- **이메일 확인 링크가 localhost로 감**: 4단계 Supabase Site URL/Redirect URLs 미설정.
- **`next: latest` 관련 재현성**: lockfile이 커밋돼 있으면 Vercel이 16.2.9 설치. 만약 향후 `npm install`로 Next가 올라가 빌드가 깨지면, `package.json`의 `next`를 `16.2.9`로 명시 고정하는 것을 검토.
- **Supabase 인프라 미코드화**: 버킷/RLS/RPC는 리포에 마이그레이션이 없고 원격 프로젝트에만 존재. **같은 Supabase 프로젝트를 재사용하므로 이번 배포엔 영향 없음.** 단, 추후 프로젝트 이전/재생성 시 수동 재구성 필요(별도 과제).
- **커스텀 도메인**: 붙일 경우 Vercel Domains에서 연결 후, 4단계 Supabase URL을 커스텀 도메인 기준으로 갱신.

## 검증 체크리스트

- [ ] 로컬 `npm run build` 통과
- [ ] Vercel 빌드 로그 성공 + 임시 도메인 접속 가능
- [ ] 인증 리다이렉트 정상 (미로그인 → `/auth/login`)
- [ ] Storage 이미지 표시 정상
- [ ] 경매 등록(쓰기+RLS+Storage) 정상
