"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getJSON, postJSON } from "@/components/api";
import { compact, timeAgo } from "@/components/format";
import { isEarlySignal } from "@/lib/trends";
import { TrendCard, TrendCardSkeleton } from "@/components/trend-card";
import { Chip, ErrorBox, Spinner } from "@/components/ui";
import type { Trend } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "rising", label: "↗ Rising only" },
  { id: "sound", label: "Sound" },
  { id: "music", label: "Music" },
  { id: "format", label: "Format" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

export default function TrendRadar() {
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTrends(await getJSON<Trend[]>("/api/trends"));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      setTrends(await postJSON<Trend[]>("/api/trends/refresh", {}));
    } catch (err) {
      setError(`Refresh failed: ${(err as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  }

  const visible = useMemo(() => {
    if (!trends) return [];
    if (filter === "all") return trends;
    if (filter === "rising") return trends.filter((t) => t.stage === "rising");
    return trends.filter((t) => t.type === filter);
  }, [trends, filter]);

  const updatedAt = trends?.reduce<string | null>((max, t) => (!max || t.updatedAt > max ? t.updatedAt : max), null);
  const earlyCount = trends?.filter(isEarlySignal).length ?? 0;
  const totalPlays = trends?.reduce((s, t) => s + t.totalPlays, 0) ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
      <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Trend Radar</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Catch the trend <span className="text-gradient">before it peaks.</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {updatedAt ? `Updated ${timeAgo(updatedAt)}` : "Scanning short-video platforms daily"}
            {trends && trends.length > 0 && (
              <>
                {" "}
                · {trends.length} trends · {compact(totalPlays)} plays tracked
                {earlyCount > 0 && <span className="text-amber"> · {earlyCount} early signals</span>}
              </>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold transition hover:border-white/20 disabled:opacity-60 sm:self-auto"
        >
          {refreshing ? <Spinner /> : <span aria-hidden>↻</span>}
          {refreshing ? "Scanning TikTok… (1–4 min)" : "Refresh trends"}
        </button>
      </section>

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBox message={error} onRetry={load} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {trends === null && !error
          ? Array.from({ length: 8 }, (_, i) => <TrendCardSkeleton key={i} />)
          : visible.map((t) => <TrendCard key={t.id} trend={t} rank={trends!.indexOf(t) + 1} />)}
      </div>

      {trends && visible.length === 0 && (
        <p className="py-16 text-center text-muted">
          {trends.length === 0 ? "No trends yet. Hit “Refresh trends” to scan." : "No trends match this filter."}
        </p>
      )}
    </main>
  );
}
