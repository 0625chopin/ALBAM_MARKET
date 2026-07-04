// 알밤마켓 컴포넌트 전시장 (화면 우선 개발 원칙 — CLAUDE.md 참조)
// 신규 표현 컴포넌트는 반드시 이 페이지에 등록할 것
// TODO: Phase 2 경매 카드, 입찰 패널, 거래 목록 등 도메인 컴포넌트 추가 예정
import Link from "next/link";
import CommonShowcase from "@/components/sample/common-showcase";
import AuctionShowcase, {
  BidPanelShowcase,
} from "@/components/sample/auction-showcase";
import AuctionFormShowcase from "@/components/sample/auction-form-showcase";
import TransactionsShowcase from "@/components/sample/transactions-showcase";
import ChatShowcase from "@/components/sample/chat-showcase";
import ProfileShowcase from "@/components/sample/profile-showcase";
import StateShowcase from "@/components/sample/state-showcase";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { Button } from "@0625chopin/shared/ui/button";
import { Badge } from "@0625chopin/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@0625chopin/shared/ui/card";
import { Input } from "@0625chopin/shared/ui/input";
import { Label } from "@0625chopin/shared/ui/label";
import { Checkbox } from "@0625chopin/shared/ui/checkbox";

// 시맨틱 컬러 토큰 스와치 정의
const COLOR_TOKENS: Array<{ name: string; bg: string; border?: boolean }> = [
  { name: "background", bg: "bg-background", border: true },
  { name: "foreground", bg: "bg-foreground" },
  { name: "primary", bg: "bg-primary" },
  { name: "primary-foreground", bg: "bg-primary-foreground", border: true },
  { name: "secondary", bg: "bg-secondary" },
  { name: "secondary-foreground", bg: "bg-secondary-foreground" },
  { name: "muted", bg: "bg-muted" },
  { name: "muted-foreground", bg: "bg-muted-foreground" },
  { name: "accent", bg: "bg-accent" },
  { name: "accent-foreground", bg: "bg-accent-foreground" },
  { name: "destructive", bg: "bg-destructive" },
  { name: "border", bg: "bg-border" },
  { name: "card", bg: "bg-card", border: true },
  { name: "card-foreground", bg: "bg-card-foreground" },
];

// 섹션 목차 앵커 정의
const TOC_ITEMS = [
  { label: "색상 토큰", href: "#colors" },
  { label: "타이포그래피", href: "#typography" },
  { label: "버튼", href: "#buttons" },
  { label: "배지", href: "#badges" },
  { label: "카드", href: "#cards" },
  { label: "입력 필드", href: "#inputs" },
  { label: "공통 컴포넌트", href: "#common" },
  { label: "라우트 점검", href: "#routes" },
  { label: "경매 카드", href: "#auctions" },
  { label: "입찰 패널", href: "#bid" },
  { label: "경매 등록 폼", href: "#auction-form" },
  { label: "거래", href: "#transactions" },
  { label: "채팅", href: "#chat" },
  { label: "프로필", href: "#profile" },
  { label: "상태 (로딩/빈/에러)", href: "#states" },
  { label: "향후 추가 예정", href: "#components-todo" },
] as const;

// 골격 검증용 임시 라우트 링크 정의 (Phase 2에서 실제 카드/목록 링크로 교체)
const ROUTE_LINKS: Array<{ label: string; href: string; description: string }> =
  [
    { label: "홈", href: "/", description: "메인 페이지" },
    { label: "경매 등록", href: "/auctions/new", description: "경매 등록 폼" },
    { label: "거래", href: "/transactions", description: "거래 목록" },
    { label: "내 프로필", href: "/profile", description: "내 프로필 페이지" },
    {
      label: "경매 상세 (샘플)",
      href: "/auctions/sample-id",
      description:
        "동적 라우트 — 경매 상세 (실데이터 전환 후 임시 ID는 404, 실제 상품은 홈에서 진입)",
    },
    {
      label: "채팅 (샘플)",
      href: "/chat/sample-room",
      description: "동적 라우트 — 채팅방",
    },
    {
      label: "타인 프로필 (샘플)",
      href: "/profile/sample-user",
      description: "동적 라우트 — 타인 프로필",
    },
  ];

export default function SamplePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <Container className="py-10">
          {/* 페이지 헤더 */}
          <div className="mb-10 space-y-2">
            <h1 className="text-foreground text-3xl font-bold">
              컴포넌트 전시장
            </h1>
            <p className="text-muted-foreground">
              알밤마켓 디자인 시스템 — 모든 표현 컴포넌트를 한눈에 확인하세요.
            </p>
          </div>

          {/* 목차 */}
          <nav
            className="bg-muted/40 mb-12 rounded-lg border p-4"
            aria-label="섹션 목차"
          >
            <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
              목차
            </h2>
            <ul className="flex flex-wrap gap-2">
              {TOC_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ===== 색상 토큰 섹션 ===== */}
          <section id="colors" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              색상 토큰
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              시맨틱 CSS 변수 기반 색상입니다. 다크모드 토글 시 자동으로
              반전됩니다.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {COLOR_TOKENS.map((token) => (
                <div key={token.name} className="space-y-1.5">
                  <div
                    className={`h-12 rounded-md ${token.bg} ${token.border ? "border" : ""}`}
                    aria-label={`${token.name} 색상`}
                  />
                  <p className="text-muted-foreground font-mono text-xs">
                    {token.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ===== 타이포그래피 섹션 ===== */}
          <section id="typography" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              타이포그래피
            </h2>
            <div className="space-y-4 rounded-lg border p-6">
              <div>
                <h1 className="text-foreground text-4xl font-extrabold">
                  H1 — 알밤마켓 (4xl / extrabold)
                </h1>
              </div>
              <div>
                <h2 className="text-foreground text-3xl font-bold">
                  H2 — 경매 목록 (3xl / bold)
                </h2>
              </div>
              <div>
                <h3 className="text-foreground text-2xl font-semibold">
                  H3 — 상품 상세 (2xl / semibold)
                </h3>
              </div>
              <div>
                <h4 className="text-foreground text-xl font-semibold">
                  H4 — 섹션 제목 (xl / semibold)
                </h4>
              </div>
              <div>
                <p className="text-foreground text-base">
                  본문 텍스트 (base) — 경매 상품에 대한 설명을 이곳에
                  작성합니다. 중고 마켓의 상품 특성과 상태를 자세히 안내합니다.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  보조 텍스트 (sm / muted-foreground) — 카테고리, 등록일, 조회수
                  등 메타 정보 표시에 사용합니다.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-mono text-xs">
                  모노스페이스 (xs / mono) — 경매 ID, 타임스탬프, 코드 표시용
                </p>
              </div>
            </div>
          </section>

          {/* ===== 버튼 섹션 ===== */}
          <section id="buttons" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">버튼</h2>

            {/* Variant 전시 */}
            <div className="mb-6 space-y-3 rounded-lg border p-6">
              <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                Variant
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Size 전시 */}
            <div className="rounded-lg border p-6">
              <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
                Size
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="아이콘 버튼 예시">
                  {/* TODO: 아이콘 삽입 */}★
                </Button>
              </div>
            </div>
          </section>

          {/* ===== 배지 섹션 ===== */}
          <section id="badges" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">배지</h2>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              {/* 도메인 배지 예시 */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Badge variant="default">경매 진행중</Badge>
                <Badge variant="secondary">거래 완료</Badge>
                <Badge variant="outline">예약중</Badge>
                <Badge variant="destructive">낙찰</Badge>
              </div>
            </div>
          </section>

          {/* ===== 카드 섹션 ===== */}
          <section id="cards" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">카드</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* 기본 카드 */}
              <Card>
                <CardHeader>
                  <CardTitle>기본 카드</CardTitle>
                  <CardDescription>카드 설명 텍스트입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    카드 본문 영역입니다. 상품 정보, 경매 내용 등을 표시합니다.
                  </p>
                </CardContent>
                <CardFooter>
                  {/* TODO: 상세 보기 동작 구현 (인터랙션 추가 시 별도 Client Component로 분리) */}
                  <Button size="sm" variant="outline" className="w-full">
                    상세 보기
                  </Button>
                </CardFooter>
              </Card>

              {/* 경매 상품 카드 (도메인 예시) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      빈티지 가죽 지갑
                    </CardTitle>
                    <Badge variant="default" className="text-xs">
                      경매중
                    </Badge>
                  </div>
                  <CardDescription>카테고리: 패션/잡화</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-foreground text-lg font-bold">
                      현재가: 15,000원
                    </p>
                    <p className="text-muted-foreground text-xs">
                      입찰 12회 · 종료까지 2시간
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  {/* TODO: 입찰 기능 구현 (인터랙션 추가 시 별도 Client Component로 분리) */}
                  <Button size="sm" variant="outline" className="flex-1">
                    입찰하기
                  </Button>
                  {/* TODO: 즉시 구매 기능 구현 (인터랙션 추가 시 별도 Client Component로 분리) */}
                  <Button size="sm" className="flex-1">
                    즉시 구매
                  </Button>
                </CardFooter>
              </Card>

              {/* 컨텐츠만 있는 카드 */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">
                    컨텐츠만 있는 카드 패턴 — 헤더/푸터 없이 본문만 표시할 때
                    사용합니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== 입력 필드 섹션 ===== */}
          <section id="inputs" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              입력 필드
            </h2>
            <div className="rounded-lg border p-6">
              <div className="grid grid-cols-1 gap-6">
                {/* 텍스트 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="sample-input-text">텍스트 입력</Label>
                  <Input
                    id="sample-input-text"
                    type="text"
                    placeholder="상품명을 입력하세요"
                    readOnly
                  />
                </div>

                {/* 이메일 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="sample-input-email">이메일</Label>
                  <Input
                    id="sample-input-email"
                    type="email"
                    placeholder="example@albbam.com"
                    readOnly
                  />
                </div>

                {/* 숫자 입력 (입찰가) */}
                <div className="space-y-2">
                  <Label htmlFor="sample-input-price">입찰가 (원)</Label>
                  <Input
                    id="sample-input-price"
                    type="number"
                    placeholder="0"
                    readOnly
                  />
                </div>

                {/* 비활성 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="sample-input-disabled">비활성 상태</Label>
                  <Input
                    id="sample-input-disabled"
                    type="text"
                    placeholder="비활성화된 필드"
                    disabled
                  />
                </div>
              </div>

              {/* 체크박스 */}
              <div className="mt-6 space-y-3">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                  체크박스
                </h3>
                <div className="flex items-center gap-2">
                  <Checkbox id="sample-check-1" />
                  <Label htmlFor="sample-check-1" className="cursor-pointer">
                    이용 약관에 동의합니다
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="sample-check-2" defaultChecked />
                  <Label htmlFor="sample-check-2" className="cursor-pointer">
                    마케팅 정보 수신에 동의합니다 (선택)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="sample-check-3" disabled />
                  <Label
                    htmlFor="sample-check-3"
                    className="text-muted-foreground cursor-not-allowed"
                  >
                    비활성 체크박스
                  </Label>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 라우트 점검 섹션 (골격 검증용 임시 링크) ===== */}
          {/* TODO: Phase 2에서 실제 카드/목록 링크로 교체 후 이 섹션 제거 */}
          <section id="routes" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              라우트 점검
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              동적 라우트는 흐름으로 진입하므로, 골격 검증용 임시 링크입니다.
              (Phase 2에서 실제 카드/목록 링크로 교체)
            </p>
            <div className="rounded-lg border p-6">
              <div className="flex flex-wrap gap-3">
                {ROUTE_LINKS.map((route) => (
                  <Button
                    key={route.href}
                    variant="outline"
                    asChild
                    title={route.description}
                  >
                    <Link href={route.href}>{route.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* ===== 공통 컴포넌트 쇼케이스 ===== */}
          <CommonShowcase />

          {/* ===== 경매 카드 쇼케이스 ===== */}
          <AuctionShowcase />

          {/* ===== 입찰 패널 쇼케이스 (T023) ===== */}
          <BidPanelShowcase />

          {/* ===== 경매 등록 폼 쇼케이스 (T024) ===== */}
          <AuctionFormShowcase />

          {/* ===== 거래 컴포넌트 쇼케이스 (T025) ===== */}
          <TransactionsShowcase />

          {/* ===== 채팅 컴포넌트 쇼케이스 (T026) ===== */}
          <ChatShowcase />

          {/* ===== 프로필 컴포넌트 쇼케이스 (T027) ===== */}
          <ProfileShowcase />

          {/* ===== 상태 컴포넌트 쇼케이스 (T030: 로딩/빈/에러 3종) ===== */}
          <StateShowcase />

          {/* ===== 향후 추가 예정 (Phase 2) ===== */}
          <section id="components-todo" className="mb-16 scroll-mt-20">
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              향후 추가 예정
            </h2>
            <div className="bg-muted/20 rounded-lg border border-dashed p-8 text-center">
              <p className="text-foreground mb-4 font-semibold">
                Phase 2 도메인 컴포넌트 (개발 예정)
              </p>
              <ul className="text-muted-foreground mx-auto max-w-md space-y-2 text-left text-sm">
                {/* TODO: Phase 3+ 구현 시 실제 컴포넌트로 교체 */}
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  AuctionDetailPanel — 경매 상세 패널
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  BidPanel — 입찰 입력 패널
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  CategoryFilter — 카테고리 필터 바
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground">○</span>
                  SearchBar — 상품 검색 바
                </li>
              </ul>
            </div>
          </section>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
