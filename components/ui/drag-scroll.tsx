"use client";

// 가로 드래그 스크롤 컨테이너 (Client Component)
// 마우스로 좌우를 잡아끌면(드래그) 내부가 가로로 스크롤된다. 스크롤바는 숨긴다(scrollbar-none).
// - 터치 기기는 브라우저 기본 스와이프 스크롤을 그대로 쓰므로 별도 처리하지 않는다.
// - 드래그로 이동한 경우에는 이어지는 click 이벤트를 막아, 내부 링크/버튼이 실수로 눌리지 않게 한다.
// children 은 서버 컴포넌트(예: Link 목록)를 그대로 넘길 수 있다.

import { useRef, type ComponentProps } from "react";
import { cn } from "@0625chopin/shared/utils";

// div 의 모든 속성(role, aria-* 등)을 그대로 받되, 아래 마우스 핸들러는 내부에서 관리한다.
type DragScrollProps = Omit<
  ComponentProps<"div">,
  | "onMouseDown"
  | "onMouseMove"
  | "onMouseUp"
  | "onMouseLeave"
  | "onClickCapture"
>;

// 이 거리(px) 이상 움직였을 때만 "드래그"로 간주해 클릭을 취소한다.
const DRAG_THRESHOLD = 5;

export function DragScroll({ children, className, ...rest }: DragScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 드래그 진행 상태 (리렌더가 필요 없어 ref로 관리)
  const isDown = useRef(false);
  // 드래그 시작 시점의 좌표/스크롤 위치
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  // 임계값 이상 움직였는지 — 이어지는 click 취소 여부 판단에 사용
  const moved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDown.current = true;
    moved.current = false;
    startX.current = e.pageX;
    startScrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!isDown.current || !el) return;
    const delta = e.pageX - startX.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) moved.current = true;
    el.scrollLeft = startScrollLeft.current - delta;
  };

  const endDrag = () => {
    isDown.current = false;
  };

  // 드래그로 이동한 직후의 click은 취소 (내부 링크 이동/버튼 클릭 방지)
  const handleClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClickCapture={handleClickCapture}
      className={cn(
        "scrollbar-none overflow-x-auto",
        // 드래그 중 텍스트가 선택되는 것을 막고, 커서를 grab 형태로 표시
        "cursor-grab select-none active:cursor-grabbing",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
