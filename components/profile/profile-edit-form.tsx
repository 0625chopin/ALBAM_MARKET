"use client";

// 프로필 수정 폼 컴포넌트 (Client Component, T027 마크업 + T031 인터랙션 + T050 실저장)
// T050: handleSubmit 내부를 Supabase profiles update 로 교체(실데이터 저장).
//       아바타 업로드: 파일 선택 시 즉시 미리보기, "저장" 시 Storage(avatars) 업로드 + avatar_url 반영.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/mutations/profiles";
import { IMAGE_ALLOWED_TYPES, IMAGE_MAX_SIZE } from "@/lib/supabase/storage";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile, SelectOption } from "@/lib/types";

interface ProfileEditFormProps {
  /** 수정할 프로필 데이터 (초기값 바인딩용) */
  profile: Profile;
  /** 저장 성공 후 이동할 경로 (지정 시 해당 경로로 복귀, 미지정 시 현재 화면에 피드백 표시) */
  afterSaveHref?: string;
  /** 직거래 지역 옵션 (호출부가 DB 공통코드/Mock 에서 주입) */
  regions: SelectOption[];
}

export function ProfileEditForm({
  profile,
  afterSaveHref,
  regions,
}: ProfileEditFormProps) {
  const router = useRouter();

  // 닉네임 입력값 상태 (초기값: profile.nickname)
  const [nickname, setNickname] = useState(profile.nickname);

  // 지역 선택값 상태 (profile.region 라벨 → 옵션 값으로 역매핑)
  const [regionValue, setRegionValue] = useState(
    regions.find((opt) => opt.label === profile.region)?.value ?? ""
  );

  // 닉네임 검증 에러 (없으면 null)
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  // 저장 진행 상태 (스피너 표시용)
  const [isSaving, setIsSaving] = useState(false);
  // 저장 완료 피드백 표시 여부
  const [saved, setSaved] = useState(false);
  // 저장 실패 메시지 (없으면 null)
  const [saveError, setSaveError] = useState<string | null>(null);

  // 선택한 아바타 파일 (저장 시 Storage 업로드, 없으면 변경 없음)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // 아바타 미리보기 objectURL (선택 즉시 화면 반영용, 없으면 기존 avatarUrl 사용)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // 아바타 미리보기용 닉네임 첫 글자 (닉네임 입력 연동)
  const avatarFallback = nickname.charAt(0) || profile.nickname.charAt(0);

  // 파일 선택 시: 타입/크기 검증 후 미리보기 설정 및 파일 보관
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 허용 타입/크기 검증 (공통 이미지 정책 = 버킷 정책과 일치)
    if (!(IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setSaveError("JPG/PNG/WEBP/GIF 이미지만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }
    if (file.size > IMAGE_MAX_SIZE) {
      setSaveError("이미지 크기는 5MB 이하여야 합니다.");
      e.target.value = "";
      return;
    }

    setSaveError(null);
    setSaved(false);
    // 이전 미리보기 objectURL 정리 후 새 미리보기 설정
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  };

  // 저장 처리 — 닉네임 검증 후 Supabase profiles update (T050 실저장)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setSaveError(null);

    // 닉네임 비어있음 검증
    if (nickname.trim() === "") {
      setNicknameError("닉네임을 입력해 주세요.");
      return;
    }

    setNicknameError(null);
    setIsSaving(true);

    // 선택된 지역 value(예: seoul) → 저장용 라벨(예: 서울)로 변환 (미선택 시 빈 문자열)
    const regionLabel =
      regions.find((opt) => opt.value === regionValue)?.label ?? "";

    // 갱신할 필드 (아바타 선택 시 Storage 업로드 후 avatar_url 포함)
    const updates: {
      nickname: string;
      region: string;
      avatar_url?: string;
    } = { nickname: nickname.trim(), region: regionLabel };

    if (avatarFile) {
      try {
        updates.avatar_url = await uploadAvatar(avatarFile, profile.id);
      } catch {
        setIsSaving(false);
        setSaveError(
          "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
        return;
      }
    }

    // 본인 행만 갱신 (RLS: auth.uid() = id). profile.id 는 현재 사용자 UUID.
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    setIsSaving(false);
    if (error) {
      setSaveError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    // 업로드 완료된 미리보기 objectURL 정리 (이후 카드/폼은 실 avatar_url 사용)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setAvatarFile(null);

    // afterSaveHref 지정 시 해당 경로로 복귀(+재검증), 미지정 시 현재 화면에 저장 피드백 표시
    if (afterSaveHref) {
      router.push(afterSaveHref);
      router.refresh();
      return;
    }

    setSaved(true);
    // 서버 컴포넌트(프로필 카드) 재검증으로 변경 사항 반영
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">프로필 수정</CardTitle>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* 아바타 변경 영역 */}
          <div className="flex flex-col items-center gap-3">
            {/* 아바타 미리보기 — 선택 중인 이미지 > 기존 아바타 > 닉네임 첫 글자 폴백 */}
            <Avatar className="size-20 text-2xl">
              {(avatarPreview || profile.avatarUrl) && (
                <AvatarImage
                  src={avatarPreview ?? profile.avatarUrl ?? undefined}
                  alt={`${profile.nickname} 아바타 미리보기`}
                />
              )}
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>

            {/* 이미지 변경 버튼 (투명 파일 입력이 버튼 위에 겹쳐 클릭 시 파일 선택창 오픈) */}
            <div className="relative inline-flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="아바타 이미지 변경"
              >
                이미지 변경
              </Button>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="아바타 이미지 파일 선택"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div className="space-y-2">
            <Label htmlFor="profile-edit-nickname">닉네임</Label>
            <Input
              id="profile-edit-nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (nicknameError) setNicknameError(null);
                if (saved) setSaved(false);
              }}
              placeholder="닉네임을 입력하세요"
              autoComplete="nickname"
              aria-invalid={nicknameError !== null}
              aria-describedby={
                nicknameError ? "profile-edit-nickname-error" : undefined
              }
            />
            {nicknameError && (
              <p
                id="profile-edit-nickname-error"
                className="text-xs font-medium text-destructive"
                role="alert"
              >
                {nicknameError}
              </p>
            )}
          </div>

          {/* 직거래 지역 선택 */}
          <div className="space-y-2">
            <Label htmlFor="profile-edit-region">직거래 지역</Label>
            <Select value={regionValue} onValueChange={setRegionValue}>
              <SelectTrigger id="profile-edit-region" className="w-full">
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 저장 완료 피드백 */}
          {saved && (
            <p
              className="text-center text-sm font-medium text-foreground"
              role="status"
              aria-live="polite"
            >
              프로필이 저장되었습니다.
            </p>
          )}

          {/* 저장 실패 피드백 */}
          {saveError && (
            <p
              className="text-center text-sm font-medium text-destructive"
              role="alert"
            >
              {saveError}
            </p>
          )}

          {/* 저장 버튼 (풀폭) */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
