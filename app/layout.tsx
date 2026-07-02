import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { BottomNavGate } from "@/components/layout/bottom-nav-gate";
import { InAppBrowserGuard } from "@/components/in-app-browser-guard";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// 알밤마켓 메타데이터
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "알밤마켓 — 중고 경매 마켓플레이스",
  description: "알밤마켓에서 중고 물품을 경매로 사고 팔아보세요.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* 인앱 브라우저(카톡/네이버 등) 감지 시 외부 브라우저로 열도록 유도 */}
          <InAppBrowserGuard />
          {/* 모바일 사이즈 프레임 — 데스크톱에서도 화면 중앙 430px 컬럼으로 고정 */}
          <div className="flex min-h-screen w-full justify-center bg-muted/30">
            <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-lg">
              {children}
              {/* 모바일 하단 탭바 (인증 화면에서는 자동 숨김)
                  BottomNav는 usePathname()(요청 시점 데이터)을 사용하고,
                  BottomNavGate는 로그인 여부(getClaims)를 서버 조회하므로
                  cacheComponents 환경의 동적 처리를 위해 Suspense로 감쌈 */}
              <Suspense fallback={null}>
                <BottomNavGate />
              </Suspense>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
