// 타인 프로필 페이지 (T027 Phase 2 → 실데이터 전환, ISSUE-020)
// 수정 폼 없이 ProfileCard만 표시한다(읽기 전용).

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ProfileCard } from "@/components/profile/profile-card";
import { fetchProfile, fetchProfileScores } from "@/lib/queries";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

// cacheComponents 정석 패턴: 페이지는 동기로 두어 셸을 prerender 하고,
// 동적 params는 Suspense 안의 async 자식에서 await 한다(fallback은 non-null).
export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 제목 */}
          <h1 className="mb-6 text-2xl font-bold text-foreground">프로필</h1>

          {/* 430px 모바일 프레임 기준 콘텐츠 영역 */}
          <div className="mx-auto max-w-[430px]">
            {/* 동적 params를 Suspense 경계 안에서 처리 (ISSUE-011 참고) */}
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">
                  프로필 불러오는 중…
                </p>
              }
            >
              <ProfileContent params={params} />
            </Suspense>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}

// 동적 params를 await해서 Supabase 실데이터로 프로필을 조회하는 async 자식 컴포넌트
async function ProfileContent({ params }: ProfilePageProps) {
  const { id } = await params;

  // 프로필 조회 (없으면 404)
  const profile = await fetchProfile(id);
  if (!profile) notFound();

  // 역할별 평균 별점 (profile_reputation 뷰, 평가 없으면 0)
  const { sellerAvgScore, buyerAvgScore } = await fetchProfileScores(id);

  return (
    // 타인 프로필: 프로필 카드만 표시 (수정 폼 미노출)
    <ProfileCard
      profile={profile}
      sellerAvgScore={sellerAvgScore}
      buyerAvgScore={buyerAvgScore}
    />
  );
}
