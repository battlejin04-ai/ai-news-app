"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Notice = { kind: "success" | "error"; text: string };

export function FetchNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function handleClick() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "뉴스를 가져오지 못했습니다.");
      }
      setNotice({
        kind: "success",
        text:
          data.added > 0
            ? `새 기사 ${data.added}건 추가`
            : "새로운 기사가 없습니다.",
      });
      router.refresh();
    } catch (e) {
      setNotice({
        kind: "error",
        text: e instanceof Error ? e.message : "뉴스를 가져오지 못했습니다.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {loading ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`fixed inset-x-4 top-20 z-20 mx-auto max-w-md rounded-lg border px-4 py-3 text-sm shadow-md ${
            notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{notice.text}</span>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => setNotice(null)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
