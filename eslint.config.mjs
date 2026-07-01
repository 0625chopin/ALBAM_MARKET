import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 빌드 산출물/의존성 등 린트 대상 제외 (ignores만 가진 객체는 전역 무시)
  // next lint(deprecated) → `eslint .` 전환 시 자동 무시가 사라지므로 명시 필요
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "lib/database.types.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Prettier와 충돌하는 포맷 관련 규칙 비활성화 (반드시 배열 마지막에 위치)
  eslintConfigPrettier,
];

export default eslintConfig;
