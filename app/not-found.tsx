// 404 Not Found 페이지 (Next.js App Router not-found.tsx 규약)
// EmptyState로 "페이지를 찾을 수 없습니다" 메시지와 홈으로 이동하는 CTA 버튼을 표시한다.

import { FileSearch } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@0625chopin/shared/common/empty-state";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 404 빈 상태 안내 — FileSearch 아이콘 + 제목 + 설명 + 홈 CTA */}
          <EmptyState
            icon={FileSearch}
            title="페이지를 찾을 수 없습니다"
            description="요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다."
            actionLabel="홈으로 돌아가기"
            actionHref="/"
          />
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
