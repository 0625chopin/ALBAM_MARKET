// 이미지 Storage 업로드 공통 유틸 (Client Component / 클라이언트 mutation 용)
// 모든 이미지 업로드를 이 한 곳으로 통일한다 — createAuction(product-images),
// uploadAvatar(avatars) 등이 공유. 경로 컨벤션·캐시무력화·DB 반영은 호출부가 결정하고,
// 이 유틸은 "Supabase Storage 업로드 + 공개 URL 반환"이라는 순수 동작만 담당한다.

import { createClient } from "@/lib/supabase/client";

// 브라우저 Supabase 클라이언트 타입 (호출부가 단일 인스턴스를 재사용할 수 있도록 선택 주입)
type BrowserSupabaseClient = ReturnType<typeof createClient>;

// 이미지 버킷 공통 정책 (storage.buckets file_size_limit / allowed_mime_types 와 일치)
export const IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** 허용 타입·용량을 만족하는 이미지 파일인지 검사한다(클라이언트 사전 검증용). */
export function isAllowedImageFile(file: File): boolean {
  return (
    (IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type) &&
    file.size <= IMAGE_MAX_SIZE
  );
}

/**
 * 이미지 파일을 지정 버킷/경로에 업로드(upsert)하고 공개 URL을 반환한다.
 * - 모든 업로드는 Supabase Storage 로만 향한다(로컬 저장 없음).
 * - 캐시무력화(?v=) 등 URL 후처리는 호출부 책임(고정 경로 교체 시에만 필요).
 * @param client 호출부가 이미 만든 클라이언트(여러 작업을 한 인스턴스로 처리할 때 재사용). 미전달 시 새로 생성.
 */
export async function uploadPublicImage(
  bucket: string,
  path: string,
  file: File,
  client?: BrowserSupabaseClient
): Promise<string> {
  const supabase = client ?? createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    throw new Error("이미지 업로드에 실패했습니다.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/** 지정 버킷의 객체들을 삭제한다(고아 파일 정리용). 빈 배열이면 무동작. */
export async function removeStorageObjects(
  bucket: string,
  paths: string[],
  client?: BrowserSupabaseClient
): Promise<void> {
  if (paths.length === 0) return;
  const supabase = client ?? createClient();
  await supabase.storage.from(bucket).remove(paths);
}
