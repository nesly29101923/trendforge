"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Trend } from "@/lib/types";
import { getJSON, postJSON } from "@/components/api";
import { useBrand } from "@/components/brand";
import { BrandSheet } from "@/components/brand-sheet";
import { compact, postingWindow, timeAgo } from "@/components/format";
import { displayName, useTrendNames } from "@/components/names";
import { Button, Cover, ErrorNote, Skeleton, TopBar, cx } from "@/components/ui";

function TrendTile({ trend, name, oneLiner, onMake }: { trend: Trend; name: string; oneLiner?: string; onMake: () => void }) {
  const w = postingWindow(trend);
  return (
    <div className="flex h-full flex-col">
      <Link href={`/trend/${encodeURIComponent(trend.id)}`} className="group block flex-1">
        <Cover src={trend.sampleVideos[0]?.coverUrl} className="aspect-[9/16] rounded-2xl">
          <span
            className={cx(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold",
              !w.open ? "bg-white/85 text-ink-2" : w.urgent ? "bg-urgent text-white" : "bg-good text-white",
            )}
          >
            {w.label}
          </span>
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-8 text-xs font-medium text-white">
            {compact(trend.totalPlays)} plays
          </span>
        </Cover>
        <h3 className="mt-2.5 font-semibold leading-snug group-hover:underline">{name}</h3>
        {oneLiner && <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">{oneLiner}</p>}
      </Link>
      <Button variant={w.open ? "primary" : "secondary"} className="mt-3 w-full" onClick={onMake}>
        Make this
      </Button>
    </div>
  );
}

export default function Home() {
  const { brand, setBrand } = useBrand();
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sheet, setSheet] = useState<{ mode: "start" | "edit" } | { mode: "make"; trendId: string } | null>(null);
  const names = useTrendNames(trends);
  const router = useRouter();
  const gridRef = useRef<HTMLElement>(null);

  const toGrid = () => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const make = (trendId: string) => router.push(`/make/${encodeURIComponent(trendId)}`);
  const start = () => (brand ? toGrid() : setSheet({ mode: "start" }));

  useEffect(() => {
    getJSON<Trend[]>("/api/trends")
      .then(setTrends)
      .catch((err) => setError(`Couldn't load trends: ${err.message}`));
  }, []);

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

  // Trends you can still post first, closed windows last.
  const sorted = useMemo(
    () => (trends ? [...trends].sort((a, b) => Number(postingWindow(b).open) - Number(postingWindow(a).open) || b.momentumScore - a.momentumScore) : []),
    [trends],
  );
  const updatedAt = trends?.reduce<string | null>((m, t) => (!m || t.updatedAt > m ? t.updatedAt : m), null);

  return (
    <>
      <TopBar brandName={brand?.brandName} onEditBrand={() => setSheet({ mode: "edit" })} />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="flex flex-col items-start py-12 sm:py-20">
          <h1 className="max-w-3xl text-[36px] font-semibold leading-[1.1] sm:text-[56px]">Turn today&apos;s TikTok trends into your next ad.</h1>
          <p className="mt-4 max-w-xl text-[17px] text-ink-2 sm:text-lg">
            Pick a trend. Get a ready-to-post video and a simple guide to film it yourself, in about 2 minutes.
          </p>
          <Button size="lg" className="mt-8 px-8" onClick={start}>
            {brand ? `Let's start, ${brand.brandName}` : "Let's start"}
          </Button>
          <ol className="mt-10 grid w-full max-w-2xl gap-4 text-sm sm:grid-cols-3">
            {["Pick a trend that's taking off", "Tell us your brand, once", "Get a video and a filming guide"].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong font-semibold tabular-nums">{i + 1}</span>
                <span className="text-ink-2">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section ref={gridRef} className="scroll-mt-20 border-t border-line pt-10">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight sm:text-[32px]">Trending today</h2>
              <p className="mt-1 text-ink-2">
                {brand ? `Pick one and we'll make it for ${brand.brandName}.` : "Pick one and we'll make it for your brand."}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              {updatedAt && <span>Updated {timeAgo(updatedAt)}</span>}
              <Button variant="secondary" onClick={refresh} loading={refreshing}>
                {refreshing ? "Scanning TikTok" : "Refresh"}
              </Button>
            </div>
          </header>

          {error && (
            <div className="mb-6">
              <ErrorNote message={error} onRetry={() => location.reload()} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {trends === null && !error
              ? Array.from({ length: 10 }, (_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[9/16] rounded-2xl" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-full" />
                  </div>
                ))
              : sorted.map((t) => (
                  <TrendTile
                    key={t.id}
                    trend={t}
                    name={displayName(t, names)}
                    oneLiner={names[t.id]?.oneLiner}
                    onMake={() => (brand ? make(t.id) : setSheet({ mode: "make", trendId: t.id }))}
                  />
                ))}
          </div>

          {trends?.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-medium">No trends scanned yet.</p>
              <Button className="mt-4" onClick={refresh} loading={refreshing}>
                Scan TikTok now
              </Button>
            </div>
          )}
        </section>
      </main>

      {sheet && (
        <BrandSheet
          initial={brand ?? null}
          title={sheet.mode === "edit" ? "Your brand" : "Who are you making ads for?"}
          submitLabel={sheet.mode === "make" ? "Make it" : sheet.mode === "start" ? "Show me trends" : "Save"}
          onClose={() => setSheet(null)}
          onSave={(b) => {
            setBrand(b);
            setSheet(null);
            if (sheet.mode === "make") make(sheet.trendId);
            if (sheet.mode === "start") setTimeout(toGrid, 50);
          }}
        />
      )}
    </>
  );
}
