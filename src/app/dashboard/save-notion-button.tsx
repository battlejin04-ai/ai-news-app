"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SaveNotionButton({
  articleId,
  saved,
}: {
  articleId: number;
  saved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className="shrink-0 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
      >
        저장됨
      </button>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${articleId}/notion`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      // 409: 이미 저장됨 — 화면만 갱신하면 '저장됨'으로 바뀐다.
      if (!res.ok && res.status !== 409) {
        throw new Error(data?.error ?? "Notion에 저장하지 못했습니다.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Notion에 저장하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "저장 중…" : "뉴스 저장"}
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
