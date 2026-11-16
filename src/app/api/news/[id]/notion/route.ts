import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { saveArticleToNotion } from "@/lib/notion/save-article";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "잘못된 기사 id입니다." }, { status: 400 });
  }

  const [row] = await db
    .select({
      article: articles,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "기사를 찾을 수 없습니다." }, { status: 404 });
  }
  const { article } = row;

  // 중복 저장 방지
  if (article.notionPageId) {
    return NextResponse.json(
      { error: "이미 Notion에 저장된 기사입니다.", notionPageId: article.notionPageId },
      { status: 409 },
    );
  }

  try {
    const notionPageId = await saveArticleToNotion({
      title: article.titleKo ?? article.originalTitle,
      category: row.categoryName ?? "미분류",
      url: article.url,
      date: article.publishedAt ?? article.createdAt,
      summary: article.summaryKo ?? article.contentSnippet ?? "",
    });

    await db
      .update(articles)
      .set({ notionPageId })
      .where(eq(articles.id, id));

    return NextResponse.json({ notionPageId });
  } catch (error) {
    console.error("Notion 저장 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Notion 저장 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
