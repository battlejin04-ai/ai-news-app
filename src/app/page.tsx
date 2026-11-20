import { redirect } from "next/navigation";

// 실제 기능은 /dashboard에 있으므로, 루트로 들어오면 대시보드로 보낸다.
// 로그인 처리는 /dashboard의 AuthGate가 담당한다.
export default function Home() {
  redirect("/dashboard");
}
