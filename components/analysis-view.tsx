import type { TrendAnalysis } from "@/lib/types";
import { Skeleton } from "./ui";

const categoryLabel: Record<TrendAnalysis["category"], string> = {
  dance: "Dance",
  acting: "Acting",
  lipsync: "Lip-sync",
  transition: "Transition",
  product: "Product showcase",
  pov: "POV",
  other: "Format",
};

/** Seconds from a "0-2s" style range, for proportional timeline segments. */
function span(t: string) {
  const [a, b] = t.replace(/s/g, "").split(/[-–]/).map(Number);
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? b - a : 1;
}

export function AnalysisView({ analysis }: { analysis: TrendAnalysis }) {
  const total = analysis.structure.reduce((s, x) => s + span(x.t), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="max-w-[65ch] text-[17px] leading-relaxed">{analysis.summary}</p>
        <p className="mt-2 text-sm text-muted">
          {categoryLabel[analysis.category]}
          {analysis.hasHumans ? ", needs someone on camera" : ", no one on camera needed"}
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">How it plays out</h3>
        <div className="flex h-2 overflow-hidden rounded-full" aria-hidden>
          {analysis.structure.map((s, i) => (
            <div
              key={i}
              style={{ flexGrow: span(s.t) / total, opacity: 1 - i * (0.6 / Math.max(1, analysis.structure.length - 1)) }}
              className="border-r-2 border-surface bg-accent last:border-r-0"
            />
          ))}
        </div>
        <ol className="mt-4 space-y-3">
          {analysis.structure.map((s, i) => (
            <li key={i} className="grid grid-cols-[64px_1fr] gap-3">
              <span className="pt-px text-sm font-medium tabular-nums text-accent">{s.t}</span>
              <span className="leading-relaxed">
                {i === 0 && <span className="font-medium">Hook. </span>}
                {s.beat}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Why it works</h3>
          <ul className="space-y-2.5">
            {analysis.whyItWorks.map((w, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-ink-2">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">Sound and timing</h3>
            <p className="leading-relaxed text-ink-2">{analysis.audioNotes}</p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Where it&apos;s heading</h3>
            <p className="leading-relaxed text-ink-2">
              Peak expected {analysis.prediction.peakEstimate.replace(/^peak(ed)?\s*/i, "")}.{" "}
              {analysis.prediction.reasoning}
            </p>
            <p className="mt-1 text-sm text-muted">Confidence {Math.round(analysis.prediction.confidence * 100)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">Watching the top videos to break the trend down. This takes 10–30 seconds.</p>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="mt-6 h-2 w-full rounded-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
