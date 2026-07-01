// 프로필(/profile) 로딩 UI (Next.js App Router loading.tsx 규약)
// page.tsx 골격(헤더 + main Container + ProfileCard + ProfileEditForm)과 동일한 구조로 스켈레톤을 렌더한다.
// 헤더는 정적 SiteHeaderSkeleton 사용(Cache Components: 로딩 셸은 정적 prerender 대상).

import { SiteHeaderSkeleton } from "@/components/layout/site-header-skeleton";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ProfileCardSkeleton } from "@/components/profile/profile-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeaderSkeleton />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 제목 스켈레톤 — page.tsx의 "내 프로필" h1 자리 */}
          <Skeleton className="mb-6 h-8 w-32" />

          {/* 430px 모바일 프레임 기준 콘텐츠 영역 */}
          <div className="mx-auto max-w-[430px] space-y-4">
            {/* 프로필 카드 스켈레톤 */}
            <ProfileCardSkeleton />

            {/* 프로필 수정 폼(ProfileEditForm) 스켈레톤 */}
            <div className="space-y-4 rounded-lg border p-6">
              {/* 폼 제목 */}
              <Skeleton className="h-5 w-28" />

              {/* 닉네임 필드 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* 지역 필드 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* 저장 버튼 */}
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
