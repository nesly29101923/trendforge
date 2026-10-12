import type { TrendAnalysis } from "@/lib/types";
import { Card, SectionTitle, Skeleton, StageBadge } from "./ui";

const categoryLabel: Record<TrendAnalysis["category"], string> = {
  dance: "💃 Dance",
  acting: "🎭 Acting",
  lipsync: "🎤 Lip-sync",
  transition: "✨ Transition",
  product: "📦 Product",
  pov: "👀 POV",
  other: "🎬 Format",
};

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--color-pink)" />
            <stop offset="100%" stopColor="var(--color-cyan)" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">{pct}%</span>
    </div>
  );
}

export function AnalysisView({ analysis }: { analysis: TrendAnalysis }) {
  const { prediction } = analysis;

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-gradient-to-br from-pink/10 via-surface to-cyan/10">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white/10 px-2.5 py-1">{categoryLabel[analysis.category]}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">{analysis.hasHumans ? "On-camera talent" : "No humans needed"}</span>
        </div>
        <p className="text-lg leading-relaxed">{analysis.summary}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon="🪝">The hook (first 2 s)</SectionTitle>
          <p className="leading-relaxed">{analysis.hook}</p>
        </Card>

        <Card>
          <SectionTitle icon="🔮">Prediction</SectionTitle>
          <div className="flex items-center gap-4">
            <ConfidenceRing value={prediction.confidence} />
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <StageBadge stage={prediction.stage} />
                <span className="text-xs text-muted">confidence</span>
              </div>
              <p className="text-lg font-semibold">Peak: {prediction.peakEstimate}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{prediction.reasoning}</p>
        </Card>
      </div>

      <Card>
        <SectionTitle icon="⏱">Timeline</SectionTitle>
        <ol className="relative space-y-3 border-l border-line pl-5">
          {analysis.structure.map((s, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-cyan ring-4 ring-surface" />
              <span className="mr-2 font-mono text-xs font-semibold text-cyan">{s.t}</span>
              <span className="leading-relaxed">{s.beat}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon="🔥">Why it works</SectionTitle>
          <ul className="space-y-2.5">
            {analysis.whyItWorks.map((w, i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pink/15 text-xs font-bold text-pink">
                  {i + 1}
                </span>
                {w}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle icon="🎧">Audio</SectionTitle>
            <p className="leading-relaxed">{analysis.audioNotes}</p>
          </Card>
          <Card>
            <SectionTitle icon="🎯">Brand fit</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {analysis.brandFit.goodFor.map((b) => (
                <span key={b} className="rounded-full bg-cyan/10 px-2.5 py-1 text-sm text-cyan ring-1 ring-cyan/25">
                  ✓ {b}
                </span>
              ))}
              {analysis.brandFit.avoidFor.map((b) => (
                <span key={b} className="rounded-full bg-white/5 px-2.5 py-1 text-sm text-muted ring-1 ring-white/10 line-through decoration-pink/60">
                  {b}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center gap-3 text-sm text-muted">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan" />
          </span>
          AI is watching the videos and breaking down the trend… (10–30 s)
        </div>
        <Skeleton className="mb-2 h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}
