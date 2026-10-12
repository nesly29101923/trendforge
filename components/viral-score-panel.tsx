"use client";

import { useEffect, useRef, useState } from "react";
import type { Trend, ViralScore } from "@/lib/types";
import { postForm } from "./api";
import { compact } from "./format";
import { Button, ErrorNote, Panel, Spinner, cx } from "./ui";

const BRIEF_KEY = "trendforge:brief";

const STEPS = ["Uploading your draft", "Watching it frame by frame", "Comparing it with the trend", "Estimating your views"];

const CRITERIA = ["Hook in the first 1.5 s", "Trend fidelity", "Beat sync & pacing", "Retention / loop", "Visual quality", "Brand integration", "Call to action"];

const PRIORITY = {
  high: "text-urgent",
  medium: "text-accent",
  low: "text-muted",
};

const scoreColor = (s: number) => (s >= 75 ? "var(--color-good)" : s >= 50 ? "var(--color-accent)" : "var(--color-urgent)");

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
    <Panel className="p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Check your draft before posting</h2>
      <p className="mt-1 max-w-[60ch] text-ink-2">
        Shot it already? Upload the draft. We score it against what makes this trend work, list the exact fixes, and estimate the views
        you&apos;d get before and after.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
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
            className="relative grid aspect-[9/16] w-full max-w-[180px] place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-canvas text-center hover:border-ink/40"
          >
            {preview ? (
              <video src={preview} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-sm text-ink-2">
                <span className="block font-medium text-ink">Upload draft</span>
                <span className="mt-1 block text-xs text-muted">Vertical MP4 or MOV</span>
              </span>
            )}
          </button>
          <Button className="w-full max-w-[180px]" onClick={run} disabled={!file} loading={busy}>
            {busy ? "Scoring" : result ? "Score again" : "Score my draft"}
          </Button>
        </div>

        <div className="min-w-0">
          {error && <ErrorNote message={error} onRetry={file ? run : undefined} />}
          {busy && (
            <div className="flex min-h-48 items-center gap-3 rounded-xl bg-canvas p-6 text-sm text-ink-2">
              <Spinner className="text-accent" />
              {STEPS[step]}
            </div>
          )}
          {!busy && !error && !result && (
            <div className="text-sm text-ink-2">
              <div className="mb-2 font-medium text-ink">What we check</div>
              <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {CRITERIA.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-ink-2" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result && <ScoreResult r={result} />}
        </div>
      </div>
    </Panel>
  );
}

function ScoreResult({ r }: { r: ViralScore }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl bg-canvas p-4 sm:grid-cols-[auto_auto_1fr] sm:items-center">
        <Gauge value={r.score} label="Your draft" />
        <Gauge value={r.scoreAfterFixes} label="After fixes" />
        <div className="sm:pl-4">
          <div className="text-sm text-ink-2">Expected views</div>
          <div className="text-sm text-muted line-through">
            {compact(r.expectedViews.before.low)}–{compact(r.expectedViews.before.high)} as is
          </div>
          <div className="text-2xl font-semibold tabular-nums text-good">
            {compact(r.expectedViews.after.low)}–{compact(r.expectedViews.after.high)}
          </div>
          <div className="text-sm text-ink-2">with the fixes below</div>
        </div>
      </div>
      <p className="text-[17px] font-medium">{r.verdict}</p>

      <div>
        <h3 className="mb-3 font-semibold">Fixes, most important first</h3>
        <ol className="divide-y divide-line rounded-xl border border-line">
          {r.fixes.map((f, i) => (
            <li key={i} className="grid gap-1 p-3 sm:grid-cols-[90px_1fr]">
              <div className="text-sm">
                <span className={cx("font-semibold capitalize", PRIORITY[f.priority])}>{f.priority}</span>
                {f.timecode && <span className="block tabular-nums text-muted">{f.timecode}</span>}
              </div>
              <div>
                <p className="font-medium">{f.fix}</p>
                <p className="text-sm text-ink-2">{f.impact}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Score breakdown</h3>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {r.breakdown.map((b) => (
            <div key={b.criterion}>
              <div className="flex justify-between text-sm">
                <span>{b.criterion}</span>
                <span className="font-semibold tabular-nums" style={{ color: scoreColor(b.score * 10) }}>
                  {b.score}/10
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full" style={{ width: `${b.score * 10}%`, background: scoreColor(b.score * 10) }} />
              </div>
              {b.note && <p className="mt-1 text-xs text-muted">{b.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label={`${label}: ${value} out of 100`}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={scoreColor(value)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="42" textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--color-ink)">
          {value}
        </text>
      </svg>
      <span className="text-sm text-ink-2">{label}</span>
    </div>
  );
}
