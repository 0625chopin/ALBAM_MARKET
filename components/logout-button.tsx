"use client";

import { createClient } from "@0625chopin/shared/supabase/client";
import { Button } from "@0625chopin/shared/ui/button";

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // 로그아웃 후 메인 페이지로 하드 네비게이션.
    // 소프트 네비게이션(router.push)은 이전 사용자의 클라이언트 라우터 캐시가
    // 남아 이전 로그인 정보가 노출될 수 있어, 전체 리로드로 캐시를 완전히 초기화한다.
    window.location.href = "/";
  };

  return <Button onClick={logout}>Logout</Button>;
}
