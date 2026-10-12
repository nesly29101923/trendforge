"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnalysisSkeleton, AnalysisView } from "@/components/analysis-view";
import { getJSON, postJSON } from "@/components/api";
import { BriefForm } from "@/components/brief-form";
import { compact } from "@/components/format";
import { isEarlySignal } from "@/lib/trends";
import { SampleVideos } from "@/components/sample-videos";
import { PublishPanel } from "@/components/publish-panel";
import { ViralScorePanel } from "@/components/viral-score-panel";
import { EarlySignalBadge, ErrorBox, MomentumBar, PlatformTags, Skeleton, StageBadge } from "@/components/ui";
import type { Trend, TrendAnalysis } from "@/lib/types";

async function fetchTrend(id: string): Promise<Trend> {
  try {
    return await getJSON<Trend>(`/api/trends/${encodeURIComponent(id)}`);
  } catch {
    const all = await getJSON<Trend[]>("/api/trends");
    const found = all.find((t) => t.id === id);
    if (!found) throw new Error("Trend not found");
    return found;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5 ring-1 ring-line">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}

export default function TrendDetail() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  if (trendError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <ErrorBox message={trendError} />
        <Link href="/" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          ← Back to Trend Radar
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-5 sm:pt-8">
      <Link href="/" className="mb-4 inline-block text-sm text-muted hover:text-fg">
        ← Trend Radar
      </Link>

      {trend ? (
        <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StageBadge stage={trend.stage} />
              {isEarlySignal(trend) && <EarlySignalBadge />}
              <PlatformTags platforms={trend.platforms} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trend.title}</h1>
            {trend.soundTitle && (
              <p className="mt-2 text-muted">
                ♫ {trend.soundTitle}
                {trend.soundAuthor && ` · ${trend.soundAuthor}`}
              </p>
            )}
            {trend.hashtags.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-sm text-cyan">
                {trend.hashtags.slice(0, 8).map((h) => (
                  <span key={h}>#{h}</span>
                ))}
              </p>
            )}
            <div className="mt-5">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Momentum score</div>
              <MomentumBar score={trend.momentumScore} large />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Plays" value={compact(trend.totalPlays)} />
              <Stat label="Videos" value={String(trend.videoCount)} />
              <Stat label="Engagement" value={`${(trend.avgEngagementRate * 100).toFixed(1)}%`} />
            </div>
          </div>
          <SampleVideos videos={trend.sampleVideos} />
        </section>
      ) : (
        <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="mt-6 h-16 w-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-[9/16]" />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold tracking-tight">
          Why it works <span className="text-sm font-medium text-muted">· AI breakdown</span>
        </h2>
        {analysisError ? (
          <ErrorBox message={`Analysis failed: ${analysisError}`} onRetry={trend ? () => analyze(trend) : undefined} />
        ) : analysis ? (
          <AnalysisView analysis={analysis} />
        ) : (
          <AnalysisSkeleton />
        )}
      </section>

      {trend && <BriefForm trend={trend} analysis={analysis} />}

      {trend && (
        <section className="mt-6 space-y-6">
          <PublishPanel trendId={trend.id} />
          <ViralScorePanel trend={trend} />
        </section>
      )}
    </main>
  );
}
