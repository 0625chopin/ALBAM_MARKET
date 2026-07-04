"use client";

// 거래 목록 Realtime 구독 (Client Component, 불가시)
// 관리자 앱·타 사용자가 transactions.status 를 바꾸면 새로고침 없이 반영되도록,
// 내 거래(seller_id/buyer_id) 변경을 postgres_changes 로 구독하고 router.refresh() 로 RSC 재조회한다.
// chat-thread.tsx 의 구독 생명주기 패턴을 재사용. RLS(transactions_select_party)가 그대로 인가에 적용됨.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@0625chopin/shared/supabase/client";

interface TransactionsRealtimeProps {
  /** 현재 로그인 사용자 id (판매자/구매자 필터용) */
  userId: string;
}

export function TransactionsRealtime({ userId }: TransactionsRealtimeProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // 변경 연타(관리자 일괄 조치 등) 방지용 짧은 debounce 후 서버 재조회
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };

    (async () => {
      // Realtime 소켓을 사용자 JWT 로 인증한 뒤 구독한다(RLS 적용을 위해 필수).
      // createBrowserClient 는 세션을 비동기 복원하므로 즉시 subscribe 하면 anon 으로 join 되어
      // RLS(transactions_select_party)가 변경 전달을 차단할 수 있다.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      await supabase.realtime.setAuth(session?.access_token ?? null);

      // 사용자는 판매자 또는 구매자 → OR 조건을 필터 2개 바인딩으로 커버
      channel = supabase
        .channel(`transactions:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transactions",
            filter: `seller_id=eq.${userId}`,
          },
          refresh
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transactions",
            filter: `buyer_id=eq.${userId}`,
          },
          refresh
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
