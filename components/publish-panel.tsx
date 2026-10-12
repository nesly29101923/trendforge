"use client";

import { useEffect, useRef, useState } from "react";
import type { BrandBrief, CaptionInsights, HashtagStat, PublishPlan } from "@/lib/types";
import { postForm } from "./api";
import { compact } from "./format";
import { cx, ErrorNote, Panel, SectionTitle, Spinner } from "./ui";

const BRIEF_KEY = "trendforge:brief";

type Result = { plan: PublishPlan; stats: HashtagStat[]; insights: CaptionInsights };

const ROLE = {
  trend: "bg-urgent-soft text-urgent ring-urgent/30",
  broad: "bg-accent-soft text-accent ring-accent/30",
  niche: "bg-good-soft text-good ring-good/30",
  brand: "bg-canvas text-ink ring-line",
};

const STEPS = ["Uploading your video…", "AI is watching your video…", "Ranking hashtags by real reach…", "Writing your caption…", "Planning how to post it…"];

const inputClass =
  "w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent/60 focus:ring-2 focus:ring-accent/20";

function savedBrief(): BrandBrief | null {
  try {
    const b = JSON.parse(localStorage.getItem(BRIEF_KEY) ?? "null");
    return b?.brandName ? b : null;
  } catch {
    return null;
  }
}

export function PublishPanel({ trendId, brief, concept }: { trendId: string; brief?: BrandBrief; concept?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [draftCaption, setDraftCaption] = useState("");
  const [draftHashtags, setDraftHashtags] = useState("");
  const [result, setResult] = useState<Result | null>(null);
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
    setStep(file ? 0 : 2);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 4000);
    return () => clearInterval(id);
  }, [busy, file]);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("trendId", trendId);
      const b = brief ?? savedBrief();
      if (b) form.append("brief", JSON.stringify(b));
      if (file) form.append("video", file);
      if (draftCaption) form.append("draftCaption", draftCaption);
      if (draftHashtags) form.append("draftHashtags", draftHashtags);
      if (concept) form.append("concept", concept);
      setResult(await postForm<Result>("/api/publish", form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6">
            <SectionTitle icon="🚀">Share your video</SectionTitle>
      <h2 className="text-2xl font-bold tracking-tight">Get hashtags & a caption for your video</h2>
      <p className="mt-1 text-sm text-muted">
        Upload the video you made for this trend. AI watches it and picks the hashtags that reach the most people today
        (ranked on real scraped data), writes your caption, and tells you when and how to post it.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-[200px_1fr]">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              setResult(null);
              setFile(e.target.files?.[0] ?? null);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative grid aspect-[9/16] w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-line bg-canvas text-center transition hover:border-ink/40"
          >
            {preview ? (
              <video src={preview} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-sm text-muted">
                <span className="mb-2 block text-3xl">⬆</span>
                Upload your video
                <span className="mt-1 block text-xs">MP4 / MOV, vertical</span>
              </span>
            )}
          </button>
          {file && (
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 w-full text-xs text-muted hover:text-ink">
              Change video
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Already have a caption? (optional, we&apos;ll score it)</span>
            <input className={inputClass} value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} placeholder="POV: your oat milk finally froths…" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Your hashtags (optional)</span>
            <input className={inputClass} value={draftHashtags} onChange={(e) => setDraftHashtags(e.target.value)} placeholder="#coffee #latteart" />
          </label>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="mt-auto flex h-11 items-center justify-center gap-2 rounded-[10px] bg-ink px-5 font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {busy && <Spinner />}
            {busy ? STEPS[step] : result ? "↻ Regenerate" : file ? "Get my hashtags & caption" : "Get hashtags & caption (without video)"}
          </button>
          {!file && <p className="text-xs text-muted">Tip: upload your video for hashtags that match what&apos;s actually in it.</p>}
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote message={error} onRetry={run} />
        </div>
      )}
      {result && <PlanView r={result} />}
    </Panel>
  );
}

function PlanView({ r }: { r: Result }) {
  const { plan, stats, insights } = r;
  const hashtagLine = plan.hashtagLine || plan.hashtagSet.map((h) => `#${h.tag}`).join(" ");
  const best = plan.captions[0];
  return (
    <div className="mt-6 space-y-4">
      {plan.contentSummary && (
        <p className="rounded-xl bg-canvas px-4 py-3 text-sm ring-1 ring-line">
          <span className="text-muted">👀 AI saw: </span>
          {plan.contentSummary}
        </p>
      )}

      <div className="rounded-2xl bg-accent-soft p-5 ring-1 ring-line">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Ready to paste</span>
          <CopyButton text={`${best ? `${best.text}\n\n` : ""}${hashtagLine}`} label="Copy caption + hashtags" />
        </div>
        {best && <p className="text-lg leading-relaxed">{best.text}</p>}
        <p className="mt-2 text-lg font-semibold leading-relaxed text-accent">{hashtagLine}</p>
      </div>
      {plan.captionCheck && (
        <div className="rounded-2xl bg-accent-soft p-4 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black tabular-nums">{plan.captionCheck.score}</span>
            <span className="text-sm text-muted">/100 · your caption</span>
          </div>
          <p className="mt-1 font-semibold">{plan.captionCheck.verdict}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {plan.captionCheck.fixes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Block icon="#️⃣" title="Why these hashtags" copy={hashtagLine}>
          <ul className="space-y-2">
            {plan.hashtagSet.map((h) => (
              <li key={h.tag} className="flex gap-2 text-sm">
                <span className={cx("h-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1", ROLE[h.role])}>{h.role}</span>
                <span>
                  <b className="text-accent">#{h.tag}</b> <span className="text-muted">· {h.why}</span>
                </span>
              </li>
            ))}
          </ul>
        </Block>

        <Block icon="📊" title="Hashtag data (today's scrape)">
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-canvas text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-1.5 font-semibold">Tag</th>
                  <th className="font-semibold">Videos</th>
                  <th className="font-semibold">Median plays</th>
                  <th className="font-semibold">Eng.</th>
                  <th className="w-20 font-semibold">Strength</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 12).map((s) => (
                  <tr key={s.tag} className="border-t border-line/60">
                    <td className="py-1.5 pr-2">
                      #{s.tag} <span className="text-[10px] text-muted">{s.tier}</span>
                    </td>
                    <td className="tabular-nums">{s.videos}</td>
                    <td className="tabular-nums">{compact(s.medianPlays)}</td>
                    <td className="tabular-nums">{(s.engagementRate * 100).toFixed(1)}%</td>
                    <td>
                      <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${s.score}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      </div>

      <Block icon="✍️" title="Caption options">
        <p className="mb-3 text-xs text-muted">
          Top captions for this trend: ~{insights.medianLength} characters, {insights.medianHashtags} hashtags ·{" "}
          {Math.round(insights.questionShare * 100)}% ask a question · {Math.round(insights.emojiShare * 100)}% use emoji ·{" "}
          {Math.round(insights.ctaShare * 100)}% have a call to action
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {plan.captions.map((c) => (
            <div key={c.style} className="flex flex-col rounded-xl bg-canvas p-3 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">{c.style}</span>
                <CopyButton text={`${c.text}\n\n${hashtagLine}`} />
              </div>
              <p className="flex-1 leading-relaxed">{c.text}</p>
              <p className="mt-2 text-xs text-muted">{c.why}</p>
            </div>
          ))}
        </div>
      </Block>

      <div className="grid gap-4 md:grid-cols-3">
        {plan.platforms.map((p) => (
          <Block key={p.platform} icon={p.platform === "TikTok" ? "🎵" : p.platform === "Instagram Reels" ? "📸" : "▶️"} title={p.platform} copy={`${p.title ? `${p.title}\n\n` : ""}${p.caption}\n\n${hashtagLine}`}>
            {p.title && <p className="mb-1 text-sm font-semibold">{p.title}</p>}
            <p className="text-sm leading-relaxed">{p.caption}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
              {p.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Block>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Block icon="⏰" title="When to post">
          <p className="font-semibold">{plan.timing.when}</p>
          <p className="mt-1 text-sm text-muted">{plan.timing.why}</p>
          <p className="mt-3 text-xs text-muted">
            Cover text: <b className="text-ink">“{plan.coverText}”</b>
          </p>
        </Block>
        <Block icon="⚡" title="First hour after posting" copy={plan.firstComment}>
          <p className="mb-2 rounded-lg bg-canvas p-2 text-sm">
            📌 Pin this comment: <b>{plan.firstComment}</b>
          </p>
          <ol className="list-decimal space-y-1 pl-4 text-sm">
            {plan.firstHour.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </Block>
        <Block icon="🚫" title="Avoid">
          <ul className="space-y-1 text-sm">
            {plan.avoid.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="text-urgent">✕</span>
                {a}
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </div>
  );
}

function Block({ icon, title, copy, children }: { icon: string; title: string; copy?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas p-4 ring-1 ring-line">
      <div className="flex items-start justify-between gap-2">
        <SectionTitle icon={icon}>{title}</SectionTitle>
        {copy && <CopyButton text={copy} />}
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      className="shrink-0 rounded-lg bg-canvas px-2.5 py-1 text-xs font-medium hover:bg-line"
    >
      {done ? "✓ Copied" : label}
    </button>
  );
}
