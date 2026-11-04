import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // 페이지는 로그인 모달로 보호하고, API는 인증 없으면 차단한다.
  // auth.protect()는 로그아웃 상태에서 외부 로그인 페이지로 리다이렉트하는데,
  // fetch() 요청이 이를 따라가면 CORS 때문에 "Failed to fetch"로만 보인다.
  // 그래서 API에는 리다이렉트 대신 401 JSON을 직접 돌려준다.
  if (isApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다. 페이지를 새로고침한 뒤 다시 시도하세요." },
        { status: 401 },
      );
    }
  }
});

export const config = {
  matcher: [
    // Next.js 내부 파일과 정적 파일은 제외
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
