"use client";

import { useEffect, useState } from "react";
import type { VideoJob } from "@/lib/types";
import { getJSON } from "./api";
import type { VideoSession } from "./brief-form";
import { Card, cx, ErrorBox, SectionTitle, Spinner } from "./ui";

const POLL_MS = 3000;

type Step = { label: string; state: "done" | "active" | "todo" };

function steps(status: VideoJob["status"]): Step[] {
  const order = ["storyboard", "queued", "running", "done"] as const;
  const current = status === "error" ? -1 : order.indexOf(status === "queued" ? "queued" : status);
  const labels = ["Storyboard written", "Queued on the GPU", "Generating video", "Ready"];
  return labels.map((label, i) => ({
    label,
    state: i < current || status === "done" ? "done" : i === current ? "active" : "todo",
  }));
}

export function VideoResult({ jobId, initial }: { jobId: string; initial: VideoSession | null }) {
  const [job, setJob] = useState<VideoJob | null>(initial?.job ?? null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const storyboard = initial?.job.storyboard ?? job?.storyboard ?? [];
  const finished = job?.status === "done" || job?.status === "error";

  useEffect(() => {
    if (finished) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const next = await getJSON<VideoJob>(`/api/create/video/${encodeURIComponent(jobId)}`);
        if (cancelled) return;
        setJob((prev) => ({ ...prev, ...next, storyboard: prev?.storyboard ?? next.storyboard ?? [] }));
        setPollError(null);
        if (next.status === "done" || next.status === "error") return;
      } catch (err) {
        if (!cancelled) setPollError((err as Error).message);
      }
      timer = setTimeout(poll, POLL_MS);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, finished]);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [finished]);

  const status = job?.status ?? "queued";
  const brief = initial?.brief;
  const trend = initial?.trend;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-pink/10">
          {status === "done" && job?.videoUrl ? (
            <video
              src={job.videoUrl}
              poster={job.thumbnailUrl}
              controls
              autoPlay
              loop
              playsInline
              className="h-full w-full bg-black object-contain"
            />
          ) : status === "error" ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-pink">{job?.error ?? "Generation failed"}</div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="brand-gradient absolute inset-0 animate-pulse opacity-10" />
              <Spinner className="h-10 w-10 border-[3px] text-pink" />
              <div className="relative">
                <p className="font-semibold">Generating your ad…</p>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} · usually 1–3 min
                </p>
              </div>
            </div>
          )}
        </div>
        {status === "done" && job?.videoUrl && (
          <a
            href={job.videoUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-fg py-3 font-semibold text-bg hover:opacity-90"
          >
            ↓ Download MP4
          </a>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">✨ Generated with AI</span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {brief?.brandName ?? "Your brand"} <span className="text-muted">×</span>{" "}
            <span className="text-gradient">{trend?.title ?? "trend"}</span>
          </h1>
          {job?.model && <p className="mt-1 text-sm text-muted">Model: {job.model}</p>}
        </div>

        {pollError && <ErrorBox message={`Lost connection to the job: ${pollError}. Retrying…`} />}

        <Card>
          <SectionTitle icon="⚙️">Progress</SectionTitle>
          <ol className="space-y-2.5">
            {steps(status).map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <span
                  className={cx(
                    "grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
                    s.state === "done" && "bg-cyan text-black",
                    s.state === "active" && "bg-pink/20 text-pink ring-1 ring-pink/50",
                    s.state === "todo" && "bg-white/5 text-muted",
                  )}
                >
                  {s.state === "done" ? "✓" : s.state === "active" ? <Spinner className="h-3 w-3 border" /> : "·"}
                </span>
                <span className={s.state === "todo" ? "text-muted" : ""}>{s.label}</span>
              </li>
            ))}
          </ol>
        </Card>

        {storyboard.length > 0 && (
          <Card>
            <SectionTitle icon="🖼">Storyboard</SectionTitle>
            <ol className="space-y-3">
              {storyboard.map((s) => (
                <li key={s.shot} className="rounded-xl bg-surface-2 p-3 ring-1 ring-line">
                  <div className="mb-1 text-xs font-semibold text-cyan">
                    Shot {s.shot} · {s.durationSec}s
                  </div>
                  <p className="text-sm leading-relaxed text-fg/90">{s.prompt}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}

        <div className="flex gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm">
          <span className="text-lg" aria-hidden>♫</span>
          <p className="leading-relaxed">
            {trend?.soundTitle ? (
              <>
                Add the trending sound <strong>“{trend.soundTitle}”</strong> in the TikTok / Instagram app when posting.
              </>
            ) : (
              <>Add the trend’s sound in the TikTok / Instagram app when posting.</>
            )}{" "}
            It’s licensed in-platform; the AI video doesn’t include copyrighted music.
          </p>
        </div>
      </div>
    </div>
  );
}
