"use client";

import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

// 서버에서 로그인 여부를 렌더링하면 핸드셰이크 직후 로그인된 사용자에게도 로그인 화면이
// 잠깐 보이고, 그때 버튼을 누르면 Clerk가 "이미 로그인됨" 오류를 낸다.
// 그래서 Clerk가 로드된 뒤 클라이언트에서 판단한다.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) return <>{children}</>;
  return <SignInGate />;
}

function SignInGate() {
  const { openSignIn } = useClerk();

  useEffect(() => {
    openSignIn();
  }, [openSignIn]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">AI 뉴스 수집기</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        계속하려면 로그인이 필요합니다.
      </p>
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-full bg-black px-6 py-2 text-white dark:bg-white dark:text-black"
        >
          로그인
        </button>
      </SignInButton>
    </div>
  );
}
