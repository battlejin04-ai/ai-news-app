import * as z from "zod/v4";

export const UNCATEGORIZED = "미분류";

// 카테고리는 DB에서 수정될 수 있으므로 호출마다 enum을 만든다.
// 구조화 출력이 enum을 강제하므로 목록에 없는 카테고리는 나올 수 없다.
export function buildEnrichSchema(categoryNames: string[]) {
  return z.object({
    articles: z.array(
      z.object({
        id: z.number().int().describe("입력 기사의 id를 그대로 반환"),
        titleKo: z.string().min(1).describe("자연스러운 한국어 제목"),
        summaryKo: z.string().min(1).describe("3~4문장의 한국어 요약"),
        category: z
          .enum([UNCATEGORIZED, ...categoryNames])
          .describe("정확히 하나의 카테고리 이름"),
      }),
    ),
  });
}
