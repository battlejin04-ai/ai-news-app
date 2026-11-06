import Anthropic from "@anthropic-ai/sdk";

// 번역 품질 우선. 비용을 줄이려면 "claude-haiku-5-5"로 바꾸면 된다.
export const ENRICH_MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;

export function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY가 설정되어 있지 않습니다.");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}
