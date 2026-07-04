// 환경 변수 미설정 시 표시되는 경고 컴포넌트
import { Badge } from "@0625chopin/shared/ui/badge";
import { Button } from "@0625chopin/shared/ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex items-center gap-4">
      <Badge variant={"outline"} className="font-normal">
        Supabase 환경 변수가 필요합니다
      </Badge>
      <div className="flex gap-2">
        <Button size="sm" variant={"outline"} disabled>
          로그인
        </Button>
        <Button size="sm" variant={"default"} disabled>
          회원가입
        </Button>
      </div>
    </div>
  );
}
