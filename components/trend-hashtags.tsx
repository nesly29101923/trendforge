"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrendHashtags } from "@/lib/trend-hashtags";
import type { HashtagStat } from "@/lib/types";
import { getJSON, postJSON } from "./api";
import { compact } from "./format";
import { Card, cx, ErrorBox, SectionTitle, Skeleton, Spinner } from "./ui";

const ROLE = {
  trend: "bg-pink/15 text-pink ring-pink/30",
  broad: "bg-cyan/15 text-cyan ring-cyan/30",
  niche: "bg-amber/15 text-amber ring-amber/30",
  community: "bg-white/10 text-fg ring-white/20",
};

export function TrendHashtagsCard({ trendId }: { trendId: string }) {
  const [stats, setStats] = useState<HashtagStat[] | null>(null);
  const [ai, setAi] = useState<TrendHashtags | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    const url = `/api/trends/${encodeURIComponent(trendId)}/hashtags`;
    setError(null);
    getJSON<HashtagStat[]>(url).then(setStats).catch(() => setStats([]));
    postJSON<TrendHashtags>(url).then(setAi).catch((err) => setError((err as Error).message));
  }, [trendId]);

  useEffect(load, [load]);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  const allTags = ai?.hashtags.map((h) => `#${h.tag}`).join(" ") ?? "";

  return (
    <Card className="relative overflow-hidden">
      <div className="brand-gradient absolute inset-x-0 top-0 h-0.5" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle icon="#️⃣">Recommended hashtags</SectionTitle>
          <h2 className="-mt-1 text-xl font-bold tracking-tight">Post your video in this trend with these</h2>
        </div>
        {ai && (
          <button
            type="button"
            onClick={() => copy("all", `${ai.caption}\n\n${allTags}`)}
            className="brand-gradient rounded-xl px-4 py-2 text-sm font-bold text-black"
          >
            {copied === "all" ? "✓ Copied" : "Copy caption + hashtags"}
          </button>
        )}
      </div>

      <div className="mt-4">
        {error ? (
          <ErrorBox message={`Hashtag picks failed: ${error}`} onRetry={load} />
        ) : ai ? (
          <>
            <div className="flex flex-wrap gap-2">
              {ai.hashtags.map((h) => (
                <button
                  key={h.tag}
                  type="button"
                  title={h.why}
                  onClick={() => copy(h.tag, `#${h.tag}`)}
                  className="group rounded-full bg-surface-2 px-3 py-1.5 text-left ring-1 ring-line transition hover:ring-white/25"
                >
                  <span className="font-semibold text-cyan">#{h.tag}</span>
                  <span className={cx("ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1", ROLE[h.role])}>
                    {copied === h.tag ? "copied" : h.role}
                  </span>
                </button>
              ))}
            </div>
            <ul className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
              {ai.hashtags.map((h) => (
                <li key={h.tag}>
                  <b className="text-fg">#{h.tag}</b> · {h.why}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-black/20 p-3 text-sm">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Caption</div>
                {ai.caption}
              </div>
              <div className="rounded-xl bg-black/20 p-3 text-sm">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">How to post</div>
                {ai.tip}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-muted">
              <Spinner className="text-cyan" /> Picking the best hashtags for this trend…
            </p>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>
        )}
      </div>

      {stats && stats.length > 0 && (
        <details className="mt-4 rounded-xl bg-surface-2 p-3 ring-1 ring-line">
          <summary className="cursor-pointer text-sm font-semibold">Hashtag data from today&apos;s scrape</summary>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="py-1 font-semibold">Tag</th>
                <th className="font-semibold">Videos</th>
                <th className="font-semibold">Median plays</th>
                <th className="font-semibold">Eng.</th>
                <th className="w-20 font-semibold">Strength</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.tag} className="border-t border-line/60">
                  <td className="py-1 pr-2">
                    #{s.tag} <span className="text-[10px] text-muted">{s.tier}</span>
                  </td>
                  <td className="tabular-nums">{s.videos}</td>
                  <td className="tabular-nums">{compact(s.medianPlays)}</td>
                  <td className="tabular-nums">{(s.engagementRate * 100).toFixed(1)}%</td>
                  <td>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="brand-gradient h-full rounded-full" style={{ width: `${s.score}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </Card>
  );
}
