// 경매 관련 클라이언트 변경(mutation) — Client Component 에서 호출한다.
// 서버 전용 lib/queries/* (next/headers 의존)와 분리해 클라이언트 번들 충돌을 방지한다.

import { createClient } from "@/lib/supabase/client";
import {
  uploadPublicImage,
  removeStorageObjects,
} from "@/lib/supabase/storage";

export interface CreateAuctionInput {
  /** 제목 */
  title: string;
  /** 상품 설명 (미입력 시 null) */
  description: string | null;
  /** 카테고리 코드 (공통코드 codes.category value, 예: "digital") */
  categorySlug: string;
  /** 직거래 지역 한글 라벨 (예: "서울") */
  regionLabel: string;
  /** 중고등급 (공통코드 codes.product_condition value, 예: "good") */
  condition: string;
  /** 시작가 */
  startPrice: number;
  /** 즉시구매가 (미설정 시 null) */
  buyNowPrice: number | null;
  /** 경매 진행 시간(시간 단위, 예: 24=1일) — 마감 시각 계산에 사용 */
  durationHours: number;
  /** 업로드할 이미지 파일 (첫 장이 대표 이미지) */
  files: File[];
}

export interface CreateAuctionResult {
  productId: string;
  /** 업로드에 실패한 이미지 장수 (0이면 전부 성공) */
  failedCount: number;
}

const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * 경매 상품을 등록한다.
 * (a) products insert(seller_id=세션 사용자, category=공통코드 코드값, current_price=start_price,
 * auction_ends_at=등록자가 선택한 진행 시간으로 now()+N시간 계산해 명시 전달) →
 * (b) Storage 업로드(product-images/{userId}/{productId}/...) →
 * (c) product_images insert. RLS(본인 seller_id)·Storage 본인 경로 정책을 준수한다.
 */
export async function createAuction(
  input: CreateAuctionInput
): Promise<CreateAuctionResult> {
  const supabase = createClient();

  // 세션 사용자 (RLS insert 조건: seller_id = auth.uid())
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("로그인이 필요합니다.");

  // 상품 insert (현재가는 시작가로 초기화, status 기본 'active')
  // 카테고리는 공통코드(codes.category) 코드값을 그대로 저장한다.
  // 마감 시각(auction_ends_at)은 등록자가 선택한 진행 시간(durationHours) 기준으로
  // now()+N시간을 계산해 명시 전달한다. (미전달 시에만 DB 컬럼 DEFAULT 가 적용됨)
  const auctionEndsAt = new Date(
    Date.now() + input.durationHours * 60 * 60 * 1000
  ).toISOString();
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      seller_id: userId,
      title: input.title,
      description: input.description,
      category: input.categorySlug,
      condition: input.condition,
      region: input.regionLabel,
      start_price: input.startPrice,
      buy_now_price: input.buyNowPrice,
      current_price: input.startPrice,
      auction_ends_at: auctionEndsAt,
    })
    .select("id")
    .single();
  if (productError || !product) {
    throw new Error("상품 등록에 실패했습니다.");
  }

  // 이미지 업로드(공통 유틸) → 공개 URL → product_images insert (경로: {userId}/{productId}/{idx})
  // 모든 업로드는 Supabase Storage(product-images)로만 향한다. 개별 실패는 집계해 호출부에 알린다.
  let failedCount = 0;
  if (input.files.length > 0) {
    const imageRows: {
      product_id: string;
      url: string;
      is_primary: boolean;
    }[] = [];

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${product.id}/${i}.${ext}`;

      try {
        const publicUrl = await uploadPublicImage(
          PRODUCT_IMAGES_BUCKET,
          path,
          file,
          supabase
        );
        imageRows.push({
          product_id: product.id,
          url: publicUrl,
          is_primary: imageRows.length === 0, // 성공한 첫 장이 대표 이미지
        });
      } catch {
        failedCount += 1; // 개별 이미지 실패는 집계 후 계속
      }
    }

    if (imageRows.length > 0) {
      await supabase.from("product_images").insert(imageRows);
    }
  }

  return { productId: product.id, failedCount };
}

/**
 * 입찰 (원자적 RPC place_bid). 성공 시 갱신된 현재가를 반환한다.
 * 검증 실패(본인 상품/최소가 미만/종료)는 한글 메시지로 throw.
 */
export async function placeBid(
  productId: string,
  amount: number
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("place_bid", {
    p_product_id: productId,
    p_amount: amount,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

/**
 * 즉시구매 (원자적 RPC buy_now). 성공 시 생성된 거래 ID를 반환한다.
 */
export async function buyNow(productId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("buy_now", {
    p_product_id: productId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/**
 * 상품 내리기 (RPC withdraw_product). 본인 active 상품일 때 가능.
 * ISSUE-006: 입찰이 있으면 패널티(withdraw_with_bids)를 기록한 뒤 허용한다(누적 시 ISSUE-004 등록 제한).
 */
export async function withdrawProduct(productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("withdraw_product", {
    p_product_id: productId,
  });
  if (error) throw new Error(error.message);
}

// ===== 상품 정보 수정 (판매자 전용) =====

/** 대표 이미지로 지정할 대상 — 기존 이미지(id) 또는 새로 추가한 파일(newFiles 인덱스) */
export type PrimarySelection =
  { kind: "existing"; id: string } | { kind: "new"; index: number } | null;

export interface UpdateAuctionInput {
  /** 대상 상품 ID */
  productId: string;
  /** 상품 설명 (미입력 시 null) */
  description: string | null;
  /** 즉시구매가 (해제 시 null) */
  buyNowPrice: number | null;
  /** 삭제할 기존 이미지 (id + Storage 경로 추출용 url) */
  removedImages: { id: string; url: string }[];
  /** 새로 추가 업로드할 파일 */
  newFiles: File[];
  /** 대표 이미지로 지정할 대상 (null이면 남은 이미지 중 첫 장으로 폴백) */
  primary: PrimarySelection;
}

export interface UpdateAuctionResult {
  /** 업로드에 실패한 새 이미지 장수 (0이면 전부 성공) */
  failedCount: number;
}

/**
 * 공개 이미지 URL에서 Storage 객체 경로를 추출한다.
 * getPublicUrl 형식: `.../object/public/product-images/{path}`. 버킷 마커 이후가 경로.
 * 쿼리스트링(?v= 등)은 제거한다. 형식이 다르면 null.
 */
function extractStoragePath(publicUrl: string): string | null {
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length).split("?")[0];
}

/**
 * 상품 정보(사진/설명/즉시구매가)를 수정한다. 본인 active 상품일 때만 의미가 있으며,
 * 최종 권한은 RLS(products/product_images의 seller_id = auth.uid())가 강제한다.
 * (a) products update(description, buy_now_price) — 반영 행 확인으로 조용한 실패 감지 →
 * (b) 삭제 이미지 정리(product_images 행 삭제 + Storage 객체 제거) →
 * (c) 새 이미지 업로드(파일명 UUID로 경로 충돌 방지) + product_images insert →
 * (d) 대표 이미지 단일 재설정(기존 대표 해제 후 지정 1장만 is_primary=true).
 */
export async function updateAuction(
  input: UpdateAuctionInput
): Promise<UpdateAuctionResult> {
  const supabase = createClient();

  // 세션 사용자 (Storage 경로 컨벤션 {userId}/{productId}/... 및 로그인 확인)
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("로그인이 필요합니다.");

  // (a) 상품 텍스트 필드 갱신 (RLS: seller_id = auth.uid()). .select()로 실제 반영 행 확인.
  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update({
      description: input.description,
      buy_now_price: input.buyNowPrice,
    })
    .eq("id", input.productId)
    .select("id");
  if (updateError) throw new Error("상품 정보 수정에 실패했습니다.");
  if (!updated || updated.length === 0) {
    // RLS 차단(비소유자) 또는 대상 미존재 — 에러 없는 조용한 실패를 명시적으로 알린다.
    throw new Error("수정 권한이 없거나 대상을 찾을 수 없습니다.");
  }

  // (b) 삭제 대상 이미지: DB 행 삭제 후 Storage 객체 제거 (경로는 공개 URL에서 추출)
  if (input.removedImages.length > 0) {
    const removedIds = input.removedImages.map((img) => img.id);
    await supabase.from("product_images").delete().in("id", removedIds);

    const paths = input.removedImages
      .map((img) => extractStoragePath(img.url))
      .filter((p): p is string => p !== null);
    await removeStorageObjects(PRODUCT_IMAGES_BUCKET, paths, supabase);
  }

  // (c) 새 이미지 업로드 → product_images insert (대표 여부는 (d)에서 일괄 재설정)
  // 파일명에 UUID를 사용해 등록 시의 고정 인덱스 경로({i}.ext)와의 덮어쓰기 충돌을 방지한다.
  let failedCount = 0;
  const uploadedUrls: { index: number; url: string }[] = [];
  for (let i = 0; i < input.newFiles.length; i++) {
    const file = input.newFiles[i];
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${input.productId}/${crypto.randomUUID()}.${ext}`;
    try {
      const publicUrl = await uploadPublicImage(
        PRODUCT_IMAGES_BUCKET,
        path,
        file,
        supabase
      );
      uploadedUrls.push({ index: i, url: publicUrl });
    } catch {
      failedCount += 1; // 개별 실패는 집계 후 계속
    }
  }
  if (uploadedUrls.length > 0) {
    await supabase.from("product_images").insert(
      uploadedUrls.map((u) => ({
        product_id: input.productId,
        url: u.url,
        is_primary: false,
      }))
    );
  }

  // (d) 대표 이미지 재설정 — 지정 대상 → 실패 시 남은 이미지 중 첫 장으로 폴백
  let primaryImageId: string | null = null;
  if (input.primary?.kind === "existing") {
    primaryImageId = input.primary.id;
  } else if (input.primary?.kind === "new") {
    // 새 파일이 실제 업로드된 경우에만 그 URL로 삽입된 행을 조회 (URL은 UUID라 고유)
    // 콜백 클로저 내 narrowing 유지를 위해 인덱스를 지역 변수로 캡처
    const primaryIndex = input.primary.index;
    const match = uploadedUrls.find((u) => u.index === primaryIndex);
    if (match) {
      const { data: row } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", input.productId)
        .eq("url", match.url)
        .maybeSingle();
      primaryImageId = row?.id ?? null;
    }
  }
  if (!primaryImageId) {
    // 대표였던 이미지가 삭제되었거나 지정이 없을 때: 남은 이미지 아무 1장을 대표로.
    const { data: firstRow } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", input.productId)
      .limit(1)
      .maybeSingle();
    primaryImageId = firstRow?.id ?? null;
  }
  if (primaryImageId) {
    // 기존 대표 해제 후 단일 대표 지정 (product_images_update_owner RLS 허용)
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", input.productId)
      .eq("is_primary", true);
    await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", primaryImageId);
  }

  return { failedCount };
}
