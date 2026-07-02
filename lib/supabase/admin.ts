import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * service_role 키를 사용하는 관리자용 Supabase 클라이언트.
 *
 * - RLS 를 우회하므로 반드시 서버(Route Handler / Server Action)에서만 사용한다.
 * - SUPABASE_SERVICE_ROLE_KEY 는 NEXT_PUBLIC_ 접두어가 없어야 하며(클라이언트 번들 유출 금지),
 *   .env.local 에 별도로 설정해야 한다.
 * - Fluid compute 대응: 전역 변수에 캐싱하지 말고 호출할 때마다 새로 생성한다.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. Supabase 대시보드(Settings > API)에서 service_role 키를 발급해 .env.local 에 추가하세요."
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      // 관리자 클라이언트는 세션을 저장/갱신하지 않는다(쿠키 미사용).
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
