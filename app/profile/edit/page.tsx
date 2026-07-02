// 프로필 수정 페이지 (수정 폼 전용) — /profile(조회 전용)에서 분리되었다.
// 현재 로그인 사용자(Supabase 세션)의 프로필 수정 폼만 표시한다.
// 비로그인 접근 시 /auth/login 으로 리다이렉트한다(미들웨어 + 페이지 이중 보호).

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { fetchCurrentProfile, fetchCodeGroup } from "@/lib/queries";

export default async function ProfileEditPage() {
  // 세션에서 현재 사용자 프로필 조회 (비로그인 시 보호 페이지 차단)
  const me = await fetchCurrentProfile();
  if (!me) redirect("/auth/login");

  // 직거래 지역 옵션(DB 공통코드) 주입
  const regions = await fetchCodeGroup("region");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 뒤로가기 링크 + 페이지 제목 */}
          <div className="mb-6 flex items-center gap-2">
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center transition-colors"
              aria-label="내 프로필로 돌아가기"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Link>
            <h1 className="text-foreground text-2xl font-bold">프로필 수정</h1>
          </div>

          {/* 430px 모바일 프레임 기준 콘텐츠 영역 */}
          <div className="mx-auto max-w-[430px]">
            {/* 저장 성공 시 /profile(조회)로 복귀 */}
            <ProfileEditForm
              profile={me}
              afterSaveHref="/profile"
              regions={regions}
            />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
