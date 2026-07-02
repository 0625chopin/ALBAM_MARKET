// 프로필 컴포넌트 쇼케이스 (RSC)
// /sample 페이지에서 ProfileCard(여러 프로필)와 ProfileEditForm을 전시한다.
// 430px 모바일 프레임 기준 레이아웃

import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import {
  mockProfiles,
  toSellerReputation,
  MOCK_REGION_OPTIONS,
} from "@/lib/mocks";

export default function ProfileShowcase() {
  return (
    <section id="profile" className="mb-16 scroll-mt-20">
      {/* 섹션 제목 */}
      <h2 className="mb-6 text-2xl font-bold text-foreground">프로필</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        사용자 프로필 카드와 프로필 수정 폼 컴포넌트입니다. 430px 모바일 프레임
        기준으로 설계되었습니다.
      </p>

      <div className="space-y-8">
        {/* ===== ProfileCard 전시 (여러 프로필) ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            ProfileCard — 프로필 카드 (읽기 전용)
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            판매자/구매자 레벨, 평균 별점을 역할별로 표시합니다. (ISSUE-005
            확정: 레벨 산정식 calc_reputation_level. 아래 쇼케이스는 Mock
            고정값)
          </p>
          {/* 다양한 프로필 카드 전시 — 모바일 기준 단일 컬럼, sm 이상 2열 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mockProfiles.map((profile) => {
              const sellerRep = toSellerReputation(profile.id);
              // TODO: Phase 5 — buyerAvgScore를 실제 DB 거래 기반 평균 별점으로 교체 (임시 고정값)
              const buyerAvgScore = 8.0;
              return (
                <div key={profile.id} className="max-w-[430px]">
                  <ProfileCard
                    profile={profile}
                    sellerAvgScore={sellerRep.sellerAvgScore}
                    buyerAvgScore={buyerAvgScore}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== ProfileEditForm 전시 ===== */}
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            ProfileEditForm — 프로필 수정 폼 (내 프로필 전용)
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            닉네임, 직거래 지역, 아바타 변경 UI를 포함합니다. 닉네임 검증과 저장
            피드백이 동작합니다(T031, Mock 시뮬레이션). 아바타 업로드·실제
            저장은 Phase 5에서 연결됩니다.
          </p>
          {/* 430px 모바일 프레임 폭 제한 */}
          <div className="max-w-[430px]">
            <ProfileEditForm
              profile={mockProfiles[0]}
              regions={MOCK_REGION_OPTIONS}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
