import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchAndStoreNews } from "@/lib/news/fetch-news";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const result = await fetchAndStoreNews();
    return NextResponse.json(result);
  } catch (error) {
    console.error("뉴스 수집 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "뉴스를 가져오는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
