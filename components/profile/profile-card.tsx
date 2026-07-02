// 프로필 카드 컴포넌트 (RSC — 읽기 전용)
// 아바타, 닉네임, 지역, 판매자/구매자 평판을 하나의 Card로 표시한다.
// ISSUE-005 확정: 레벨 산정식은 DB 함수 calc_reputation_level(1 + floor(완료/5) + 평점보너스)로 확정.
//            이 컴포넌트는 profiles.seller_level/buyer_level 캐시값을 표시만 한다.

import { MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/common/star-rating";
import { LevelBadge } from "@/components/common/level-badge";
import type { Profile } from "@/lib/types";

interface ProfileCardProps {
  /** 프로필 데이터 */
  profile: Profile;
  /** 판매자 역할 평균 별점 (0~10) */
  sellerAvgScore: number;
  /** 구매자 역할 평균 별점 (0~10) */
  buyerAvgScore: number;
}

export function ProfileCard({
  profile,
  sellerAvgScore,
  buyerAvgScore,
}: ProfileCardProps) {
  // 닉네임 첫 글자를 아바타 폴백 텍스트로 사용
  const avatarFallback = profile.nickname.charAt(0);

  return (
    <Card>
      <CardHeader className="pb-4">
        {/* 상단: 아바타 + 닉네임 + 지역 (중앙 정렬) */}
        <div className="flex flex-col items-center gap-3">
          {/* 아바타 — 이미지 없으면 닉네임 첫 글자 폴백 */}
          <Avatar className="size-16 text-xl">
            {profile.avatarUrl && (
              <AvatarImage
                src={profile.avatarUrl}
                alt={`${profile.nickname} 아바타`}
              />
            )}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>

          {/* 닉네임 (큰 글씨) */}
          <h2 className="text-xl font-bold text-foreground">
            {profile.nickname}
          </h2>

          {/* 지역 (MapPin 아이콘 + 지역명) */}
          <div
            className="flex items-center gap-1 text-sm text-muted-foreground"
            aria-label={`직거래 지역: ${profile.region}`}
          >
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span>{profile.region}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 구분선 */}
        <Separator className="mb-5" />

        {/* 역할별 평판 블록 2개 */}
        {/* ISSUE-005: 레벨 산정식(건수 + 별점 가중치, 임계값) 미결정 — 임시 Mock 고정값 사용 */}
        <div className="space-y-4">
          {/* 판매자 평판 블록 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              판매자 평판
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <LevelBadge level={profile.sellerLevel} role="seller" />
              <StarRating score={sellerAvgScore} max={10} />
            </div>
          </div>

          {/* 구매자 평판 블록 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              구매자 평판
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <LevelBadge level={profile.buyerLevel} role="buyer" />
              <StarRating score={buyerAvgScore} max={10} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
