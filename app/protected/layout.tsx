// 인증 보호 영역 레이아웃 — 공통 SiteHeader/SiteFooter 사용
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center">
        <div className="flex w-full max-w-5xl flex-1 flex-col gap-12 p-5 py-10">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
