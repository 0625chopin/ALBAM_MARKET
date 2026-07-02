// 하단 탭바 서버 게이트 (Server Component)
// 로그인 여부(getCurrentUserId)를 서버에서 계산해 client BottomNav 에 주입한다.
// auth-button 과 동일한 패턴이며, layout 은 이 컴포넌트를 Suspense 로 감싸
// cacheComponents 환경에서도 정적 경계를 유지한다.

import { getCurrentUserId } from "@/lib/queries";
import { BottomNav } from "./bottom-nav";

export async function BottomNavGate() {
  const userId = await getCurrentUserId();
  return <BottomNav showMyProducts={Boolean(userId)} />;
}
