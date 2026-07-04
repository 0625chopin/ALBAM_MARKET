// 내 프로필 페이지 (조회 전용) — 프로필 카드 + "프로필 수정" 버튼만 표시한다.
// 수정 폼은 별도 라우트(/profile/edit)로 분리되었다.
// 비로그인 접근 시 /auth/login 으로 리다이렉트한다.

import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { ProfileCard } from "@/components/profile/profile-card";
import { Button } from "@0625chopin/shared/ui/button";
import { fetchCurrentProfile, fetchProfileScores } from "@/lib/queries";

export default async function ProfilePage() {
  // 세션에서 현재 사용자 프로필 조회 (비로그인 시 보호 페이지 차단)
  const me = await fetchCurrentProfile();
  if (!me) redirect("/auth/login");

  // 역할별 평균 별점 (profile_reputation 뷰, 평가 없으면 0)
  const { sellerAvgScore, buyerAvgScore } = await fetchProfileScores(me.id);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 제목 */}
          <h1 className="text-foreground mb-6 text-2xl font-bold">내 프로필</h1>

          {/* 430px 모바일 프레임 기준 콘텐츠 영역 */}
          <div className="mx-auto max-w-[430px] space-y-4">
            {/* 프로필 카드 (읽기 전용) */}
            <ProfileCard
              profile={me}
              sellerAvgScore={sellerAvgScore}
              buyerAvgScore={buyerAvgScore}
            />

            {/* 수정은 별도 페이지(/profile/edit)로 이동 */}
            <Button asChild className="w-full">
              <Link href="/profile/edit">프로필 수정</Link>
            </Button>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
