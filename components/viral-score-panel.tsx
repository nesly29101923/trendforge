"use client";

import { useEffect, useRef, useState } from "react";
import type { Trend, ViralScore } from "@/lib/types";
import { postForm } from "./api";
import { compact } from "./format";
import { Card, cx, ErrorBox, SectionTitle, Spinner } from "./ui";

const BRIEF_KEY = "trendforge:brief";

const STEPS = [
  "Uploading your draft…",
  "AI is watching it frame by frame…",
  "Comparing it with the trend…",
  "Calculating your view potential…",
];

const CRITERIA = ["Hook in the first 1.5 s", "Trend fidelity", "Beat sync & pacing", "Retention / loop", "Visual quality", "Brand integration", "Call to action"];

const PRIORITY = {
  high: "bg-pink/15 text-pink ring-pink/30",
  medium: "bg-amber/15 text-amber ring-amber/30",
  low: "bg-white/5 text-muted ring-white/10",
};

const scoreColor = (s: number) => (s >= 75 ? "var(--color-cyan)" : s >= 50 ? "var(--color-amber)" : "var(--color-pink)");

function savedBrief(): { brandName?: string; product?: string } {
  try {
    return JSON.parse(localStorage.getItem(BRIEF_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function ViralScorePanel({ trend }: { trend: Trend }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ViralScore | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 5000);
    return () => clearInterval(id);
  }, [busy]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const brief = savedBrief();
      const form = new FormData();
      form.append("video", file);
      form.append("trendId", trend.id);
      form.append("brandName", brief.brandName ?? "");
      form.append("product", brief.product ?? "");
      setResult(await postForm<ViralScore>("/api/score", form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="brand-gradient absolute inset-x-0 top-0 h-0.5" />
      <SectionTitle icon="📈">Viral Score</SectionTitle>
      <h2 className="text-2xl font-bold tracking-tight">Will your draft get views?</h2>
      <p className="mt-1 text-sm text-muted">
        Upload your draft. AI scores it against what makes this trend work, lists the exact fixes and shows the views you unlock.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              setResult(null);
              setError(null);
              setFile(e.target.files?.[0] ?? null);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid aspect-[9/16] w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-line bg-surface-2 text-center transition hover:border-white/25"
          >
            {preview ? (
              <video src={preview} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-sm text-muted">
                <span className="mb-2 block text-3xl">⬆</span>
                Upload draft video
                <span className="mt-1 block text-xs">MP4 / MOV, vertical</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!file || busy}
            className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-black transition disabled:opacity-50"
          >
            {busy && <Spinner />}
            {busy ? "Scoring…" : result ? "↻ Score again" : "Get Viral Score"}
          </button>
        </div>

        <div className="min-w-0">
          {error && <ErrorBox message={error} onRetry={file ? run : undefined} />}
          {busy && (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl bg-surface-2 p-6 text-center">
              <Spinner className="h-6 w-6 text-cyan" />
              <p className="text-sm text-muted">{STEPS[step]}</p>
            </div>
          )}
          {!busy && !error && !result && (
            <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2">
              {CRITERIA.map((c) => (
                <li key={c} className="rounded-xl bg-surface-2 px-3 py-2.5 ring-1 ring-line">
                  {c}
                </li>
              ))}
            </ul>
          )}
          {result && <ScoreResult r={result} />}
        </div>
      </div>
    </Card>
  );
}

function ScoreResult({ r }: { r: ViralScore }) {
  const lift =
    r.expectedViews.before.high > 0 ? Math.round((r.expectedViews.after.high / r.expectedViews.before.high - 1) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-pink/10 via-surface-2 to-cyan/10 p-4 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center justify-around gap-4">
          <Gauge value={r.score} label="Your draft" />
          <div className="text-center">
            <div className="text-3xl font-black text-cyan">→</div>
            <div className="text-sm font-bold text-cyan">+{r.scoreAfterFixes - r.score} pts</div>
          </div>
          <Gauge value={r.scoreAfterFixes} label="After fixes" />
          <div className="rounded-xl bg-black/30 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Expected views</div>
            <div className="text-sm text-muted line-through decoration-pink/70">
              {compact(r.expectedViews.before.low)}–{compact(r.expectedViews.before.high)}
            </div>
            <div className="text-2xl font-black tabular-nums text-cyan">
              {compact(r.expectedViews.after.low)}–{compact(r.expectedViews.after.high)}
            </div>
            {lift > 0 && <div className="text-xs font-bold text-cyan">+{lift}% views</div>}
          </div>
        </div>
        <p className="mt-4 text-center text-lg font-semibold">“{r.verdict}”</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
          <SectionTitle icon="🧪">Breakdown</SectionTitle>
          <div className="space-y-3">
            {r.breakdown.map((b) => (
              <div key={b.criterion}>
                <div className="flex justify-between text-sm">
                  <span>{b.criterion}</span>
                  <span className="font-mono font-semibold" style={{ color: scoreColor(b.score * 10) }}>
                    {b.score}/10
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${b.score * 10}%`, background: scoreColor(b.score * 10) }} />
                </div>
                {b.note && <p className="mt-1 text-xs text-muted">{b.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
          <SectionTitle icon="🛠">Fixes to unlock more views</SectionTitle>
          <ol className="space-y-2.5">
            {r.fixes.map((f, i) => (
              <li key={i} className="rounded-xl bg-black/20 p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1", PRIORITY[f.priority])}>
                    {f.priority}
                  </span>
                  {f.timecode && <span className="font-mono text-xs text-cyan">{f.timecode}</span>}
                </div>
                <p className="font-semibold">{f.fix}</p>
                <p className="mt-0.5 text-muted">{f.impact}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width="108" height="108" viewBox="0 0 108 108" role="img" aria-label={`${label}: ${value} out of 100`}>
        <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke={scoreColor(value)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 54 54)"
        />
        <text x="54" y="63" textAnchor="middle" fontSize="28" fontWeight="900" fill="var(--color-fg)">
          {value}
        </text>
      </svg>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
