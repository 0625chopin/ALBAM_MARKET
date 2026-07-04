"use client";
// 전역 오류 처리 페이지 (Next.js App Router error.tsx 규약)
// 반드시 'use client'여야 한다 — error와 reset은 Next.js가 자동으로 주입한다.
// 주의: error.tsx는 항상 클라이언트 컴포넌트이므로, next/headers(서버 전용 API)에
//       의존하는 SiteHeader/SiteFooter를 렌더하면 빌드가 깨진다.
//       따라서 서버 의존성이 없는 최소 브랜드 바 + ErrorState로 구성한다.

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ErrorState } from "@0625chopin/shared/common/error-state";

interface ErrorPageProps {
  /** Next.js가 주입하는 에러 객체 (digest는 서버 오류 ID) */
  error: Error & { digest?: string };
  /** 오류 복구 시도 콜백 (Next.js 제공 — 컴포넌트를 다시 렌더) */
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-1 flex-col">
      {/* 서버 의존성 없는 최소 헤더 — 브랜드 링크만 (SiteHeader는 next/headers 의존으로 사용 불가) */}
      <header className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
        <div className="flex w-full max-w-5xl items-center p-3 px-5 text-sm">
          <Link
            href="/"
            className="text-foreground hover:text-foreground/80 font-bold"
          >
            알밤마켓
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 오류 안내 컴포넌트 — Next.js의 reset 함수를 재시도 콜백으로 연결 */}
          <ErrorState
            title="문제가 발생했습니다"
            description={
              // 개발 환경에서는 실제 오류 메시지 노출, 프로덕션에서는 일반 안내문
              process.env.NODE_ENV === "development"
                ? error.message
                : "잠시 후 다시 시도해 주세요."
            }
            onRetry={reset}
          />
        </Container>
      </main>
    </div>
  );
}
