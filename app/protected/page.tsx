// 인증 필요 페이지 — 사용자 정보 표시
import { redirect } from "next/navigation";

import { createClient } from "@0625chopin/shared/supabase/server";
import { InfoIcon } from "lucide-react";
import { Suspense } from "react";

// 서버에서 사용자 클레임 조회
async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      {/* 인증 안내 배너 */}
      <div className="w-full">
        <div className="bg-accent text-foreground flex items-center gap-3 rounded-md p-3 px-5 text-sm">
          <InfoIcon size="16" strokeWidth={2} />이 페이지는 인증된 사용자만
          접근할 수 있습니다.
        </div>
      </div>

      {/* 사용자 정보 표시 */}
      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">사용자 정보</h2>
        <pre className="max-h-32 overflow-auto rounded border p-3 font-mono text-xs">
          <Suspense
            fallback={<span className="text-muted-foreground">로딩 중...</span>}
          >
            <UserDetails />
          </Suspense>
        </pre>
      </div>
    </div>
  );
}
