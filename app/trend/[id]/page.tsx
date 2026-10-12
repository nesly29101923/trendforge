"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Trend, TrendAnalysis } from "@/lib/types";
import { AnalysisSkeleton, AnalysisView } from "@/components/analysis-view";
import { getJSON, postJSON } from "@/components/api";
import { useBrand } from "@/components/brand";
import { BrandSheet } from "@/components/brand-sheet";
import { compact, postingWindow } from "@/components/format";
import { displayName, useTrendNames } from "@/components/names";
import { SampleVideos } from "@/components/sample-videos";
import { PublishPanel } from "@/components/publish-panel";
import { Button, ErrorNote, Skeleton, TopBar, WindowStrip } from "@/components/ui";
import { ViralScorePanel } from "@/components/viral-score-panel";

async function fetchTrend(id: string): Promise<Trend> {
  try {
    return await getJSON<Trend>(`/api/trends/${encodeURIComponent(id)}`);
  } catch {
    const found = (await getJSON<Trend[]>("/api/trends")).find((t) => t.id === id);
    if (!found) throw new Error("This trend is no longer in today's scan.");
    return found;
  }
}

export default function TrendPage() {
  const router = useRouter();
  const id = decodeURIComponent(useParams<{ id: string }>().id);
  const { brand, setBrand } = useBrand();
  const [trend, setTrend] = useState<Trend | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"make" | "edit" | null>(null);
  const names = useTrendNames(trend);

  const analyze = useCallback(async (t: Trend) => {
    setAnalysisError(null);
    setAnalysis(null);
    try {
      setAnalysis(await postJSON<TrendAnalysis>(`/api/trends/${encodeURIComponent(t.id)}/analyze`, { trend: t }));
    } catch (err) {
      setAnalysisError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    fetchTrend(id)
      .then((t) => {
        setTrend(t);
        analyze(t);
      })
      .catch((err) => setTrendError(err.message));
  }, [id, analyze]);

  const make = () => router.push(`/make/${encodeURIComponent(id)}`);

  if (trendError) {
    return (
      <>
        <TopBar brandName={brand?.brandName} onEditBrand={() => setSheet("edit")} />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <ErrorNote message={trendError} />
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-accent">
            Back to trends
          </Link>
        </main>
      </>
    );
  }

  const name = trend ? displayName(trend, names) : "";
  const w = trend ? postingWindow(trend, analysis?.prediction.stage) : null;

  return (
    <>
      <TopBar brandName={brand?.brandName} onEditBrand={() => setSheet("edit")} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <Link href="/" className="text-sm font-medium text-ink-2 hover:text-ink">
          All trends
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-x-12">
          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start max-lg:order-2">
            {trend ? <SampleVideos videos={trend.sampleVideos} /> : <Skeleton className="mx-auto aspect-[9/16] w-full max-w-[320px] rounded-2xl" />}
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-start-1 max-lg:order-1">
            {trend && w ? (
              <>
                <h1 className="text-[32px] font-semibold leading-tight sm:text-[40px]">{name}</h1>
                {names[trend.id]?.oneLiner && <p className="mt-2 text-[17px] text-ink-2">{names[trend.id].oneLiner}</p>}
                <p className="mt-2 text-sm text-muted">
                  {compact(trend.totalPlays)} plays across {trend.videoCount} videos
                  {trend.soundTitle && <>. Sound: {trend.soundTitle}</>}
                </p>

                <div className="mt-6">
                  <WindowStrip window={w} />
                </div>

                <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => (brand ? make() : setSheet("make"))}>
                    {brand ? `Make this for ${brand.brandName}` : "Make this for my brand"}
                  </Button>
                  <p className="mt-3 text-sm text-ink-2">
                    You get a ready-to-post AI video and a simple guide to film it yourself, side by side. Takes about 2 minutes.
                  </p>
                  {brand && (
                    <button onClick={() => setSheet("edit")} className="mt-2 text-sm font-medium text-accent hover:underline">
                      Not {brand.brandName}? Change brand
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-11 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-8 h-28 w-full rounded-2xl" />
              </div>
            )}
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-start-2 max-lg:order-3">
            <section className="mt-6 lg:mt-6">
              <h2 className="mb-4 text-xl font-semibold">Why it&apos;s trending</h2>
              {analysisError ? (
                <ErrorNote message={`Couldn't break this trend down: ${analysisError}`} onRetry={trend ? () => analyze(trend) : undefined} />
              ) : analysis ? (
                <AnalysisView analysis={analysis} />
              ) : (
                <AnalysisSkeleton />
              )}
            </section>

            {trend && (
              <section id="draft" className="mt-14 scroll-mt-20">
                <ViralScorePanel trend={trend} />
              </section>
            )}

            {trend && (
              <section className="mt-10">
                <PublishPanel trendId={trend.id} brief={brand ?? undefined} />
              </section>
            )}
          </div>
        </div>
      </main>

      {sheet && (
        <BrandSheet
          initial={brand ?? null}
          title={sheet === "make" ? "Who is this for?" : "Your brand"}
          submitLabel={sheet === "make" ? "Make it" : "Save"}
          onClose={() => setSheet(null)}
          onSave={(b) => {
            setBrand(b);
            const wasMake = sheet === "make";
            setSheet(null);
            if (wasMake) make();
          }}
        />
      )}
    </>
  );
}
