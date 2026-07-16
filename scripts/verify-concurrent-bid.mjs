// 동시 입찰(같은 제품·같은 금액) 동시성 검증 스크립트
//
// 목적: 두 개의 인증된 Supabase 클라이언트가 "동시에" 같은 상품·같은 금액으로
//       place_bid RPC 를 호출했을 때, 정확히 1건만 성공하고 나머지 1건은
//       "최소 입찰가 …원 이상으로 입찰해 주세요." 예외로 거부되는지 검증한다.
//       (입찰 로직 자체는 place_bid RPC 의 SELECT ... FOR UPDATE 비관적 락 +
//        락 획득 후 최소가 재검증으로 이미 보호되어 있다. 이 스크립트는 그
//        불변식을 재현 가능하게 확인하는 용도다.)
//
// 실행: node scripts/verify-concurrent-bid.mjs <productId> <amount>
//       예) node scripts/verify-concurrent-bid.mjs 8f3c... 11000
//
// 사전 준비(정리 포함)는 Supabase MCP(execute_sql, RLS 우회)로 실행자가 수행한다.
//   - Setup: 활성 테스트 상품 생성(seller 는 입찰자와 달라야 함), 현재가 확인.
//   - Teardown: bids/products 에 DELETE RLS 정책이 없어 클라이언트로 못 지우므로 MCP 로 정리.
// 이 스크립트는 상품을 만들거나 지우지 않는다. 오직 "동시 입찰 2건 발사 + 결과 분류"만 한다.
//
// 입찰자 계정: 기본값은 테스트 계정 B. BID_TEST_EMAIL / BID_TEST_PASSWORD 로 오버라이드 가능.
//   FOR UPDATE 락은 "상품 행"에 걸리므로, 두 입찰자가 서로 다른 사용자든 같은 사용자의
//   두 세션이든 검증되는 직렬화 메커니즘은 동일하다(테스트 계정이 2개뿐이라 같은 사용자 2세션 사용).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// .env.local → .env 순으로 읽어 process.env 에 주입(이미 설정된 값은 유지)
function loadEnv(fileName) {
  try {
    const raw = readFileSync(join(projectRoot, fileName), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // 파일 없으면 무시
  }
}

loadEnv(".env.local");
loadEnv(".env");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// 입찰자 계정(기본: 테스트 계정 B). 상품 seller 와 반드시 다른 계정이어야 한다.
const BIDDER_EMAIL = process.env.BID_TEST_EMAIL || "0625chopin@gmail.com";
const BIDDER_PASSWORD = process.env.BID_TEST_PASSWORD || "qwer1234";

// ===== 인자 파싱 =====
const productId = process.argv[2];
const amount = Number(process.argv[3]);

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  fail(
    "환경변수가 부족합니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 설정하세요."
  );
}
if (!productId || !Number.isInteger(amount) || amount <= 0) {
  fail(
    "사용법: node scripts/verify-concurrent-bid.mjs <productId> <amount>\n" +
      "  예) node scripts/verify-concurrent-bid.mjs 8f3c-... 11000"
  );
}

// 독립 세션을 갖는 Supabase 클라이언트를 만든다(persistSession=false 로 세션 간 간섭 방지).
function newClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// 클라이언트를 입찰자 계정으로 로그인시킨다.
async function signIn(client, label) {
  const { error } = await client.auth.signInWithPassword({
    email: BIDDER_EMAIL,
    password: BIDDER_PASSWORD,
  });
  if (error) {
    fail(`${label} 로그인 실패: ${error.message}`);
  }
}

console.log("동시 입찰 검증 시작");
console.log(`  productId : ${productId}`);
console.log(
  `  amount    : ${amount.toLocaleString("ko-KR")}원 (두 세션 동일 금액)`
);
console.log(`  bidder    : ${BIDDER_EMAIL}`);
console.log("");

const clientA = newClient();
const clientB = newClient();

await signIn(clientA, "세션1");
await signIn(clientB, "세션2");

// ===== 두 세션이 같은 금액으로 동시 입찰 =====
const [r1, r2] = await Promise.allSettled([
  clientA.rpc("place_bid", { p_product_id: productId, p_amount: amount }),
  clientB.rpc("place_bid", { p_product_id: productId, p_amount: amount }),
]);

// allSettled 결과를 {data, error} 형태로 정규화(rpc 는 throw 하지 않고 {data, error} 반환)
function normalize(settled) {
  if (settled.status === "rejected") {
    return { data: null, error: { message: String(settled.reason) } };
  }
  const { data, error } = settled.value;
  return { data, error };
}

const results = [normalize(r1), normalize(r2)];

results.forEach((res, i) => {
  if (res.error) {
    console.log(`  세션${i + 1}: ❌ 거부 → ${res.error.message}`);
  } else {
    console.log(
      `  세션${i + 1}: ✅ 성공 → 확정 현재가 ${Number(res.data).toLocaleString("ko-KR")}원`
    );
  }
});
console.log("");

// ===== 불변식 단언: 성공 정확히 1건 + "최소 입찰가" 거부 정확히 1건 =====
const succeeded = results.filter((r) => !r.error && Number(r.data) === amount);
const rejectedByMin = results.filter(
  (r) => r.error && r.error.message.includes("최소 입찰가")
);

if (succeeded.length === 1 && rejectedByMin.length === 1) {
  console.log(
    "🎉 PASS: 동일 금액 동시 입찰 중 정확히 1건만 성공, 나머지는 최소 입찰가 미달로 거부되었습니다.\n" +
      "   → place_bid 의 FOR UPDATE 락 + 최소가 재검증이 동시성 경합을 올바르게 직렬화합니다."
  );
  process.exit(0);
}

// 실패 케이스 진단
if (succeeded.length === 2) {
  fail(
    "이중 낙찰 감지: 두 세션 모두 성공했습니다. FOR UPDATE 직렬화가 깨진 것으로 의심됩니다."
  );
}
fail(
  `예상과 다른 결과입니다. 성공 ${succeeded.length}건 / 최소가거부 ${rejectedByMin.length}건.\n` +
    "   상품이 active 상태이고 현재가+증가폭 == amount 인지, 입찰자가 seller 와 다른지 확인하세요."
);
