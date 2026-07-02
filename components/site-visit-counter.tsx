"use client";

// 누적 방문 카운터 (클라이언트 컴포넌트)
// - 표시: 서버에서 조회한 initialCount 를 기본값으로 렌더.
// - 증가: 세션당 1회만 increment_site_counter RPC 를 호출한다(sessionStorage 로 중복 방지).
//   서버 컴포넌트에서 증가시키면 cacheComponents 캐싱/부분 RSC 요청으로 누락될 수 있어
//   반드시 클라이언트 마운트 시점에 트리거한다. RPC 반환값(최신 count)으로 표시를 갱신한다.

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SiteCounterKey } from "@/lib/queries";

// 세션 중복 방지 키 (sessionStorage). 탭 세션 동안 카운터 key 별 1회만 증가시킨다.
const VISITED_PREFIX = "site_visited:";

export function SiteVisitCounter({
  counterKey = "home_visits",
  initialCount,
}: {
  counterKey?: SiteCounterKey;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const storageKey = `${VISITED_PREFIX}${counterKey}`;

    // 이미 이 세션에서 집계했으면 재증가하지 않는다(새로고침·SPA 재진입 포함).
    if (sessionStorage.getItem(storageKey)) return;
    // 먼저 플래그를 세워 개발 모드 StrictMode 의 이펙트 이중 실행에서 중복 호출을 막는다.
    sessionStorage.setItem(storageKey, "1");

    const supabase = createClient();
    supabase
      .rpc("increment_site_counter", { p_key: counterKey })
      .then(({ data, error }) => {
        if (error) {
          // 실패 시 다음 방문에서 재시도할 수 있도록 플래그를 되돌린다.
          sessionStorage.removeItem(storageKey);
          return;
        }
        if (typeof data === "number") setCount(data);
      });
  }, [counterKey]);

  return (
    <span className="text-sm text-muted-foreground">
      누적 방문{" "}
      <span className="font-semibold tabular-nums text-foreground">
        {count.toLocaleString("ko-KR")}
      </span>
    </span>
  );
}
