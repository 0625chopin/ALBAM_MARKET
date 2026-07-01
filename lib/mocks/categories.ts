// Mock 카테고리 데이터
// lib/constants.ts의 CATEGORY_OPTIONS와 정합하는 일부 카테고리를 정의한다.
import type { Category } from "@/lib/types";

export const mockCategories: Category[] = [
  { id: "cat-digital", name: "디지털기기", slug: "digital" },
  { id: "cat-appliance", name: "생활가전", slug: "appliance" },
  { id: "cat-furniture", name: "가구/인테리어", slug: "furniture" },
  { id: "cat-fashion", name: "의류/잡화", slug: "fashion" },
  { id: "cat-sports", name: "스포츠/레저", slug: "sports" },
  { id: "cat-hobby", name: "취미/게임/음반", slug: "hobby" },
  { id: "cat-baby", name: "유아동/출산", slug: "baby" },
];

/** id로 카테고리 조회 (없으면 첫 번째 반환) */
export function getMockCategory(id: string): Category {
  return mockCategories.find((c) => c.id === id) ?? mockCategories[0];
}
