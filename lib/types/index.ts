// 도메인 공용 타입 barrel
// 사용처에서는 `import type { Product, Bid } from "@/lib/types"` 형태로 일괄 import 한다.
// Mock 데이터와 실제 DB 데이터가 공유하는 단일 타입 계약의 진입점이다.

export type { Profile } from "./profile";
export type { Category } from "./category";
export type {
  ProductStatus,
  Product,
  ProductImage,
  SellerReputation,
  AuctionSummary,
  AuctionDetail,
} from "./product";
export type { BidStatus, Bid } from "./bid";
export type { TransactionStatus, Transaction } from "./transaction";
export type { RatingRole, Rating } from "./rating";
export type { ChatRoom, Message } from "./chat";
export type { Penalty } from "./penalty";
