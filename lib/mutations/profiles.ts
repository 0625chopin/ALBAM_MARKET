// 프로필 관련 클라이언트 변경(mutation) — Client Component 에서 호출한다.
// 서버 전용 lib/queries/* (next/headers 의존)와 분리해 클라이언트 번들 충돌을 방지한다.

import { createClient } from "@/lib/supabase/client";
import {
  uploadPublicImage,
  removeStorageObjects,
} from "@/lib/supabase/storage";

const AVATARS_BUCKET = "avatars";

/**
 * 아바타 이미지를 Storage(avatars) 에 업로드하고 공개 URL을 반환한다.
 * 경로 컨벤션 avatars/{userId}/avatar.{ext} (Storage 정책: 첫 폴더=auth.uid() 본인 경로만 쓰기).
 * - 새 파일을 먼저 업로드(실패 시 기존 아바타 보존) 후, 같은 폴더의 다른 확장자 이전 아바타를
 *   정리해 고아 파일을 방지한다(예: avatar.png → avatar.jpg 로 교체 시 png 제거).
 * - 동일 경로 upsert 라 공개 URL이 고정되므로 캐시 무력화용 쿼리스트링(?v=)을 덧붙여 반환한다.
 * profiles.avatar_url 갱신은 호출부(프로필 수정 폼)의 update 에서 함께 처리한다.
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `avatar.${ext}`;
  const path = `${userId}/${fileName}`;

  // 1) 새 아바타 업로드(공통 유틸) — 실패 시 throw 되어 기존 아바타는 보존된다.
  const publicUrl = await uploadPublicImage(
    AVATARS_BUCKET,
    path,
    file,
    supabase
  );

  // 2) 같은 폴더의 다른(이전 확장자) 아바타 정리 — 고아 파일 방지
  const { data: existing } = await supabase.storage
    .from(AVATARS_BUCKET)
    .list(userId);
  if (existing && existing.length > 0) {
    const orphanPaths = existing
      .filter((obj) => obj.name !== fileName)
      .map((obj) => `${userId}/${obj.name}`);
    await removeStorageObjects(AVATARS_BUCKET, orphanPaths, supabase);
  }

  // 3) 고정 경로 upsert → 캐시 무력화 쿼리스트링 부착
  return `${publicUrl}?v=${Date.now()}`;
}
