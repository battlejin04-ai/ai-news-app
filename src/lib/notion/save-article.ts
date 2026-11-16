import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Notion DB 속성 이름 (제목: title, 카테고리: select, 출처: url, 날짜: date, 요약: rich_text)
const PROP = {
  title: "제목",
  category: "카테고리",
  url: "출처",
  date: "날짜",
  summary: "요약",
} as const;

// rich_text 한 덩어리의 최대 길이(Notion 제한)
const RICH_TEXT_LIMIT = 2000;

export type NotionArticleInput = {
  title: string;
  category: string;
  url: string;
  date: Date;
  summary: string;
};

function chunk(text: string): { type: "text"; text: { content: string } }[] {
  const parts: { type: "text"; text: { content: string } }[] = [];
  for (let i = 0; i < text.length; i += RICH_TEXT_LIMIT) {
    parts.push({
      type: "text",
      text: { content: text.slice(i, i + RICH_TEXT_LIMIT) },
    });
  }
  return parts;
}

async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await client.callTool({ name, arguments: args });
  const first = Array.isArray(result.content) ? result.content[0] : undefined;
  const text = first && first.type === "text" ? first.text : "";
  if (result.isError) {
    throw new Error(`Notion 호출 실패(${name}): ${text || "알 수 없는 오류"}`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Notion 응답을 해석할 수 없습니다(${name}).`);
  }
}

/**
 * 공식 Notion MCP 서버를 자식 프로세스로 띄워 DB에 기사 한 건을 저장하고
 * 생성된 페이지 id를 돌려준다. 호출마다 프로세스를 띄우고 닫는다.
 */
export async function saveArticleToNotion(
  input: NotionArticleInput,
): Promise<string> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("NOTION_TOKEN 또는 NOTION_DATABASE_ID가 설정되어 있지 않습니다.");
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(
        process.cwd(),
        "node_modules",
        "@notionhq",
        "notion-mcp-server",
        "bin",
        "cli.mjs",
      ),
    ],
    // 최소한의 환경만 넘겨 다른 비밀 값이 자식 프로세스로 새지 않게 한다.
    env: {
      NOTION_TOKEN: token,
      PATH: process.env.PATH ?? "",
      SystemRoot: process.env.SystemRoot ?? "",
    },
    stderr: "ignore",
  });
  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });

  try {
    await client.connect(transport);

    // Notion 최신 API는 database_id가 아니라 data source를 부모로 요구한다.
    const database = await callTool(client, "API-retrieve-a-database", {
      database_id: databaseId,
    });
    const dataSources = database.data_sources as { id: string }[] | undefined;
    const dataSourceId = dataSources?.[0]?.id;
    if (!dataSourceId) {
      throw new Error("Notion 데이터베이스에서 data source를 찾을 수 없습니다.");
    }

    const page = await callTool(client, "API-post-page", {
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties: {
        [PROP.title]: { title: chunk(input.title) },
        [PROP.category]: { select: { name: input.category } },
        [PROP.url]: { url: input.url },
        [PROP.date]: { date: { start: input.date.toISOString() } },
        [PROP.summary]: { rich_text: chunk(input.summary) },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: chunk(input.summary) },
        },
      ],
    });

    const pageId = page.id;
    if (typeof pageId !== "string") {
      throw new Error("Notion 페이지 id를 받지 못했습니다.");
    }
    return pageId;
  } finally {
    await client.close().catch(() => {});
  }
}
