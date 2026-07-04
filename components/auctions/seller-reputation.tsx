// 판매자 신뢰 정보 카드 컴포넌트 (RSC) — F012
// 판매자 아바타, 닉네임, 지역, 레벨 배지, 별점을 표시한다.
// Avatar(shadcn)로 아바타를 렌더하고, avatarUrl이 없으면 닉네임 첫 글자로 Fallback 표시.

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@0625chopin/shared/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@0625chopin/shared/ui/card";
import { LevelBadge } from "@0625chopin/shared/common/level-badge";
import { StarRating } from "@0625chopin/shared/common/star-rating";
import { MapPin } from "lucide-react";
import type { SellerReputation } from "@0625chopin/shared/types";

interface SellerReputationProps {
  /** 판매자 평판 요약 데이터 */
  seller: SellerReputation;
}

export function SellerReputation({ seller }: SellerReputationProps) {
  // 아바타 Fallback용 첫 글자 (닉네임 앞 1자)
  const avatarInitial = seller.nickname.charAt(0).toUpperCase();

  return (
    <Card className="w-full rounded-none border-x-0">
      <CardHeader className="pb-3">
        {/* 섹션 제목 */}
        <CardTitle className="text-muted-foreground text-sm font-semibold">
          판매자 신뢰 정보
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4">
          {/* 아바타 — size="lg"(size-10) 적용 */}
          <Avatar size="lg" aria-label={`${seller.nickname} 프로필 사진`}>
            {/* Phase 5: avatarUrl 있을 때 실제 이미지 표시 */}
            {seller.avatarUrl && (
              <AvatarImage
                src={seller.avatarUrl}
                alt={`${seller.nickname} 아바타`}
              />
            )}
            {/* avatarUrl 없거나 로드 실패 시 닉네임 첫 글자 */}
            <AvatarFallback aria-hidden="true">{avatarInitial}</AvatarFallback>
          </Avatar>

          {/* 판매자 정보 텍스트 블록 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 닉네임 + 레벨 배지 한 줄 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground truncate text-sm font-semibold">
                {seller.nickname}
              </span>
              <LevelBadge level={seller.sellerLevel} role="seller" />
            </div>

            {/* 지역 */}
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {seller.region}
            </p>

            {/* 별점 */}
            <StarRating score={seller.sellerAvgScore} max={10} showValue />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
