"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandBrief, FilmGuide, Trend, TrendAnalysis, VideoJob } from "@/lib/types";
import { postJSON, session, uploadFile } from "./api";
import { Card, cx, ErrorBox, SectionTitle, Spinner } from "./ui";

const TONES: BrandBrief["tone"][] = ["fun", "premium", "edgy", "wholesome", "informative"];
const GOALS: BrandBrief["goal"][] = ["awareness", "engagement", "sales"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "fi", label: "Suomi" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];
const BRIEF_KEY = "trendforge:brief";

const EMPTY: BrandBrief = { brandName: "", product: "", audience: "", tone: "fun", goal: "awareness", language: "en" };

export type GuideSession = { guide: FilmGuide; brief: BrandBrief; trend: Pick<Trend, "id" | "title" | "soundTitle"> };
export type VideoSession = { job: VideoJob; brief: BrandBrief; trend: Pick<Trend, "id" | "title" | "soundTitle"> };

function loadBrief(): BrandBrief {
  try {
    const saved = localStorage.getItem(BRIEF_KEY);
    return saved ? { ...EMPTY, ...JSON.parse(saved), productImageUrl: undefined } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition",
            value === o ? "bg-fg text-bg" : "bg-surface-2 text-muted ring-1 ring-line hover:text-fg",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-base outline-none transition placeholder:text-muted/60 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/20";

const GUIDE_STEPS = ["Reading the trend breakdown…", "Matching it to your brand…", "Writing shots on the beat…", "Adding caption & hashtags…"];

export function BriefForm({ trend, analysis }: { trend: Trend; analysis: TrendAnalysis | null }) {
  const router = useRouter();
  const [brief, setBrief] = useState<BrandBrief>(EMPTY);
  const [busy, setBusy] = useState<"guide" | "video" | null>(null);
  const [step, setStep] = useState(0);
  const [quality, setQuality] = useState<"fast" | "hero">("fast");
  const [upload, setUpload] = useState<{ name: string; preview: string; state: "uploading" | "done" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setBrief(loadBrief()), []);

  useEffect(() => {
    if (busy !== "guide") return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, GUIDE_STEPS.length - 1)), 4000);
    return () => clearInterval(id);
  }, [busy]);

  const set = <K extends keyof BrandBrief>(key: K, value: BrandBrief[K]) => setBrief((b) => ({ ...b, [key]: value }));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUpload({ name: file.name, preview: URL.createObjectURL(file), state: "uploading" });
    try {
      const { url } = await uploadFile("/api/create/video/upload", file);
      set("productImageUrl", url);
      setUpload((u) => u && { ...u, state: "done" });
    } catch (err) {
      setUpload((u) => u && { ...u, state: "error" });
      setError(`Image upload failed: ${(err as Error).message}`);
    }
  }

  function validate() {
    if (!brief.brandName.trim() || !brief.product.trim()) {
      setError("Add at least your brand name and product.");
      return false;
    }
    if (upload?.state === "uploading") {
      setError("Wait for the product image to finish uploading.");
      return false;
    }
    try {
      localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
    } catch {}
    setError(null);
    return true;
  }

  const trendRef = { id: trend.id, title: trend.title, soundTitle: trend.soundTitle };

  async function filmIt() {
    if (!validate()) return;
    setBusy("guide");
    try {
      const guide = await postJSON<FilmGuide>("/api/create/guide", {
        trendId: trend.id,
        trend,
        brief,
        analysis: analysis ?? undefined,
      });
      const id = `guide-${Date.now().toString(36)}`;
      session.set(id, { guide, brief, trend: trendRef } satisfies GuideSession);
      router.push(`/create/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  async function generate() {
    if (!validate()) return;
    setBusy("video");
    try {
      const job = await postJSON<VideoJob>("/api/create/video", {
        trendId: trend.id,
        trend,
        brief,
        analysis: analysis ?? undefined,
        quality,
      });
      session.set(`job:${job.jobId}`, { job, brief, trend: trendRef } satisfies VideoSession);
      router.push(`/create/${encodeURIComponent(job.jobId)}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="brand-gradient absolute inset-x-0 top-0 h-0.5" />
      <SectionTitle icon="🏷">Your brand brief</SectionTitle>
      <h2 className="mb-5 text-2xl font-bold tracking-tight">Make this trend yours</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Brand name *</span>
          <input className={inputClass} value={brief.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Oatly" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Product *</span>
          <input className={inputClass} value={brief.product} onChange={(e) => set("product", e.target.value)} placeholder="Barista oat milk" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">Audience</span>
          <input
            className={inputClass}
            value={brief.audience}
            onChange={(e) => set("audience", e.target.value)}
            placeholder="Gen Z coffee lovers in big cities"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Tone</span>
          <Segmented value={brief.tone} options={TONES} onChange={(v) => set("tone", v)} />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Goal</span>
          <Segmented value={brief.goal} options={GOALS} onChange={(v) => set("goal", v)} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Language</span>
          <select className={inputClass} value={brief.language ?? "en"} onChange={(e) => set("language", e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Product image (optional, 9:16 works best)</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line bg-surface-2 px-3 py-2 text-left text-sm text-muted transition hover:border-white/25"
          >
            {upload ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={upload.preview} alt="" className="h-9 w-9 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate text-fg">{upload.name}</span>
                {upload.state === "uploading" && <Spinner />}
                {upload.state === "done" && <span className="text-cyan">✓</span>}
                {upload.state === "error" && <span className="text-pink">!</span>}
              </>
            ) : (
              <>
                <span className="grid h-9 w-9 place-items-center rounded-md bg-white/5 text-lg">＋</span>
                Upload for image-to-video
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBox message={error} />
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={filmIt}
          disabled={busy !== null}
          className="group flex flex-col items-start gap-1 rounded-2xl border border-cyan/40 bg-cyan/10 p-4 text-left transition hover:bg-cyan/15 disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-lg font-bold">
            {busy === "guide" ? <Spinner className="text-cyan" /> : "🎬"} Film It Yourself
          </span>
          <span className="text-sm text-muted">
            {busy === "guide" ? GUIDE_STEPS[step] : "Shot-by-shot guide: angles, lighting, timing on the beat."}
          </span>
        </button>

        <div className="flex flex-col rounded-2xl border border-pink/40 bg-pink/10 p-4">
          <button
            type="button"
            onClick={generate}
            disabled={busy !== null}
            className="flex flex-col items-start gap-1 text-left disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-lg font-bold">
              {busy === "video" ? <Spinner className="text-pink" /> : "✨"} Generate with AI
            </span>
            <span className="text-sm text-muted">
              {busy === "video" ? "Writing the storyboard…" : "No crew? Get a 9:16 AI video ad in ~2 minutes."}
            </span>
          </button>
          <div className="mt-3 flex gap-1 self-start rounded-lg bg-black/30 p-1 text-xs font-semibold">
            {(["fast", "hero"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={cx("rounded-md px-2.5 py-1 transition", quality === q ? "bg-pink text-white" : "text-muted hover:text-fg")}
              >
                {q === "fast" ? "Fast · Kling" : "Hero · Veo + audio"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
