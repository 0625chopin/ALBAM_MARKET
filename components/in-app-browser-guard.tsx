"use client";

// 인앱 브라우저(카카오톡/네이버/인스타 등 웹뷰) 탈출 가드
// 배경: 인앱 웹뷰는 쿠키 저장소가 격리/휘발성이라 @supabase/ssr의 쿠키 기반 세션이
//       유지되지 않는다. 로그인 직후에는 세션이 메모리에 있어 되는 듯 보이지만,
//       다른 페이지로 이동(=새 서버 요청)하면 세션 쿠키가 없어 미들웨어가 미로그인으로
//       판단 → 보호 경로가 전부 로그인창으로 리다이렉트된다.
// 대응: 인앱 브라우저를 감지하면 외부 브라우저(Chrome/Safari)로 열도록 유도한다.

import { useEffect, useState } from "react";

// 인앱 브라우저 판별 (User-Agent 기반)
function detectInApp(ua: string) {
  const s = ua.toLowerCase();
  const isKakao = s.includes("kakaotalk");
  // 대표적인 인앱 웹뷰들 + 안드로이드 WebView 마커("; wv")
  const isInApp =
    isKakao ||
    s.includes("naver") ||
    s.includes("inapp") ||
    s.includes("instagram") ||
    s.includes("fban") ||
    s.includes("fbav") ||
    s.includes("line/") ||
    s.includes("daumapps") ||
    s.includes("; wv");
  const isAndroid = s.includes("android");
  const isIOS = /iphone|ipad|ipod/.test(s);
  return { isInApp, isKakao, isAndroid, isIOS };
}

export function InAppBrowserGuard() {
  const [info, setInfo] = useState<ReturnType<typeof detectInApp> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const detected = detectInApp(navigator.userAgent);
    if (!detected.isInApp) return;
    setInfo(detected);

    // 안드로이드는 외부 브라우저로 자동 전환 시도 (실패 시 아래 오버레이가 폴백)
    if (detected.isAndroid) {
      const url = window.location.href;
      if (detected.isKakao) {
        // 카카오톡 전용: 외부 브라우저로 열기
        window.location.href =
          "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
      } else {
        // 그 외 안드로이드 웹뷰: intent 스킴으로 Chrome 강제 오픈
        const { host, pathname, search } = window.location;
        window.location.href =
          "intent://" +
          host +
          pathname +
          search +
          "#Intent;scheme=https;package=com.android.chrome;end";
      }
    }
    // iOS는 스킴으로 강제 전환이 불가 → 오버레이 안내만 표시
  }, []);

  if (!info) return null;

  const handleOpenExternal = () => {
    const url = window.location.href;
    if (info.isKakao) {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
      return;
    }
    if (info.isAndroid) {
      const { host, pathname, search } = window.location;
      window.location.href =
        "intent://" +
        host +
        pathname +
        search +
        "#Intent;scheme=https;package=com.android.chrome;end";
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 미지원 웹뷰 폴백
      window.prompt(
        "아래 주소를 복사해 브라우저에 붙여넣으세요.",
        window.location.href
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <h2 className="text-lg font-bold text-foreground">
          외부 브라우저에서 열어주세요
        </h2>
        <p className="text-sm text-muted-foreground">
          카카오톡·네이버 등 인앱 브라우저에서는 로그인이 정상적으로 유지되지
          않습니다. Chrome 또는 Safari 등 기본 브라우저로 열어주세요.
        </p>

        {info.isAndroid ? (
          <button
            onClick={handleOpenExternal}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            외부 브라우저로 열기
          </button>
        ) : (
          <div className="w-full rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
            우측 상단 <span className="font-semibold">···</span> 또는 공유
            아이콘을 눌러 <span className="font-semibold">Safari로 열기</span>를
            선택하세요.
          </div>
        )}

        <button
          onClick={handleCopy}
          className="w-full rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground"
        >
          {copied ? "주소를 복사했어요" : "주소 복사하기"}
        </button>
      </div>
    </div>
  );
}
