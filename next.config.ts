import type { NextConfig } from "next";

// Supabase Storage 공개 URL 호스트 (next/image 허용 도메인)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  // 공유 패키지(@0625chopin/shared) 소스를 Next가 컴파일 (src 소비 + "use client" 보존)
  transpilePackages: ["@0625chopin/shared"],
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
