// 경매 관련 클라이언트 변경(mutation) — Client Component 에서 호출한다.
// 서버 전용 lib/queries/* (next/headers 의존)와 분리해 클라이언트 번들 충돌을 방지한다.

import { createClient } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";

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
 * auction_ends_at=DB 트리거 set_auction_ends_at 가 정책값 기반으로 자동 설정) →
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
  // 마감 시각(auction_ends_at)은 서버 트리거 set_auction_ends_at 가
  // 정책값(codes.policy.default_auction_duration_hours) 기반 now()+N시간으로 채운다.
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
