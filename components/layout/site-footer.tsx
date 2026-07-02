"use client";

// 알밤마켓 도메인 푸터
// 저작권 표시 및 브랜드 정보
// 연도는 현재 연도를 동적으로 계산한다. cacheComponents 환경에서는 프리렌더 중
// new Date() 호출이 금지되므로, 클라이언트 마운트 후 useEffect에서 연도를 채운다.
import { useEffect, useState } from "react";

export function SiteFooter() {
  const [year, setYear] = useState<number | null>(null);

  // 마운트(클라이언트) 후에만 현재 연도를 계산 — 프리렌더 시각 접근 회피
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full border-t border-t-foreground/10 py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-5 text-center text-xs text-muted-foreground">
        <p suppressHydrationWarning>
          © {year ?? ""} 알밤마켓. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
