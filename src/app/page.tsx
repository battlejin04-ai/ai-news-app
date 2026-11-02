import { UserButton } from "@clerk/nextjs";
import { AuthGate } from "./auth-gate";

export default function Home() {
  return (
    <AuthGate>
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">AI 뉴스 수집기</h1>
        <UserButton />
      </header>
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-zinc-600 dark:text-zinc-400">로그인되었습니다.</p>
      </main>
    </AuthGate>
  );
}
