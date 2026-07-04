// 공통 컨테이너 래퍼 컴포넌트
// max-w-5xl 기준 너비를 통일하고 cn()으로 클래스를 병합
import { cn } from "@0625chopin/shared/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-5", className)}>
      {children}
    </div>
  );
}
