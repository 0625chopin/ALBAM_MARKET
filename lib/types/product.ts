// 경매 상품 도메인 타입
// PRD 데이터 모델 products / product_images 테이블을 camelCase로 1:1 매핑하고,
// 화면 표시에 필요한 파생 타입(AuctionSummary / AuctionDetail)을 함께 정의한다.

/**
 * 경매 상품 상태
 * - active: 경매중 / won: 낙찰 / failed: 유찰 / withdrawn: 내림(상품 내리기) / completed: 완료
 */
export type ProductStatus =
  "active" | "won" | "failed" | "withdrawn" | "completed";

/**
 * 경매 상품
 * - PRD: products
 */
export interface Product {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 판매자 (profiles.id) */
  sellerId: string;
  /** 제목 */
  title: string;
  /** 상품 설명 (선택, 미입력 시 null) */
  description: string | null;
  /** 카테고리 코드 (공통코드 codes.category value, 예: "digital") */
  category: string;
  /** 중고등급(상품 상태 텍스트) */
  condition: string;
  /** 직거래 지역 */
  region: string;
  /** 시작가 */
  startPrice: number;
  /** 즉시구매가 (선택, 미설정 시 null) */
  buyNowPrice: number | null;
  /** 현재 최고가 */
  currentPrice: number;
  /** 경매 상태 */
  status: ProductStatus;
  /** 마감 시각(등록 + 36시간), ISO 8601 */
  auctionEndsAt: string;
  /** 현재 낙찰자 (profiles.id, 미정 시 null) */
  winnerId: string | null;
}

/**
 * 상품 이미지
 * - PRD: product_images
 */
export interface ProductImage {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 소속 상품 (products.id) */
  productId: string;
  /** 이미지 URL */
  url: string;
  /** 대표 이미지 여부 */
  isPrimary: boolean;
}

/**
 * 판매자 평판 요약 (경매 상세에서 신뢰 정보 표시용)
 * - profiles + 집계 평점 일부를 추려낸 파생 타입
 */
export interface SellerReputation {
  /** 판매자 식별자 (profiles.id) */
  id: string;
  /** 닉네임 */
  nickname: string;
  /** 아바타 이미지 URL */
  avatarUrl: string | null;
  /** 직거래 기본 지역 */
  region: string;
  /** 판매자 레벨 */
  sellerLevel: number;
  /** 판매자 역할 평균 별점(1~10) */
  sellerAvgScore: number;
}

/**
 * 경매 카드 표시용 요약 (홈/목록)
 * - 대표 이미지·현재가·남은 시간 등 카드 렌더에 필요한 최소 필드
 */
export interface AuctionSummary {
  /** 상품 식별자 (products.id) */
  id: string;
  /** 제목 */
  title: string;
  /** 대표 이미지 URL (없으면 null) */
  primaryImageUrl: string | null;
  /** 시작가 (경매 시작 시점의 최초 입찰가) */
  startPrice: number;
  /** 현재 최고가 */
  currentPrice: number;
  /** 즉시구매가 (없으면 null) */
  buyNowPrice: number | null;
  /** 마감 시각(ISO 8601) — 남은 시간 계산 기준 */
  auctionEndsAt: string;
  /** 경매 상태 */
  status: ProductStatus;
  /** 경매 상태 표시 라벨 (codes.product_status label, 예: "경매중") */
  statusLabel: string;
  /** 직거래 지역 */
  region: string;
}

/**
 * 경매 상세 표시용 (상세 페이지)
 * - 상품 본문 + 이미지 목록 + 카테고리 + 판매자 평판 + 입찰 수
 */
export interface AuctionDetail extends Product {
  /** 상품 이미지 목록 */
  images: ProductImage[];
  /** 카테고리 표시 라벨 (codes.category label, 예: "디지털기기") */
  categoryLabel: string;
  /** 경매 상태 표시 라벨 (codes.product_status label, 예: "경매중") */
  statusLabel: string;
  /** 중고등급 표시 라벨 (codes.product_condition label, 예: "사용감 적음") */
  conditionLabel: string;
  /** 판매자 평판 요약 */
  seller: SellerReputation;
  /** 누적 입찰 수 */
  bidCount: number;
}
