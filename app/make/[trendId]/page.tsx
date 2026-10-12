"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FilmGuide, Trend, VideoJob } from "@/lib/types";
import { getJSON, postJSON, session } from "@/components/api";
import { useBrand } from "@/components/brand";
import { FilmCard, FilmCardSkeleton } from "@/components/film-card";
import { displayName, useTrendNames } from "@/components/names";
import { PublishPanel } from "@/components/publish-panel";
import { makeKey, type MakeState } from "@/components/session";
import { Button, ErrorNote, Panel, Spinner, TopBar } from "@/components/ui";

const POLL_MS = 3000;
const started = new Set<string>(); // survives React's double-mount in dev, so we never pay for a video twice

export default function MakePage() {
  const router = useRouter();
  const trendId = decodeURIComponent(useParams<{ trendId: string }>().trendId);
  const { brand } = useBrand();
  const [trend, setTrend] = useState<Trend | null>(null);
  const [state, setState] = useState<MakeState>({});
  const [elapsed, setElapsed] = useState(0);
  const names = useTrendNames(trend);
  const key = brand ? makeKey(trendId, brand) : null;
  const stateRef = useRef<MakeState>({});

  const update = useCallback(
    (patch: Partial<MakeState>) => {
      if (!key) return;
      stateRef.current = { ...stateRef.current, ...patch };
      session.set(key, stateRef.current);
      setState(stateRef.current);
    },
    [key],
  );

  useEffect(() => {
    if (brand === null) router.replace(`/trend/${encodeURIComponent(trendId)}`);
  }, [brand, router, trendId]);

  useEffect(() => {
    getJSON<Trend[]>("/api/trends").then((all) => setTrend(all.find((t) => t.id === trendId) ?? null));
  }, [trendId]);

  useEffect(() => {
    if (!key) return;
    stateRef.current = session.get<MakeState>(key) ?? {};
    setState(stateRef.current);
  }, [key]);

  const startVideo = useCallback(async () => {
    if (!trend || !brand || !key) return;
    update({ videoError: undefined, jobId: undefined, job: undefined });
    try {
      const job = await postJSON<VideoJob>("/api/create/video", { trendId, trend, brief: brand, quality: "fast" });
      update({ jobId: job.jobId, job });
    } catch (err) {
      update({ videoError: (err as Error).message });
    }
  }, [trend, brand, key, trendId, update]);

  const startGuide = useCallback(async () => {
    if (!trend || !brand || !key) return;
    update({ guideError: undefined });
    try {
      update({ guide: await postJSON<FilmGuide>("/api/create/guide", { trendId, trend, brief: brand }) });
    } catch (err) {
      update({ guideError: (err as Error).message });
    }
  }, [trend, brand, key, trendId, update]);

  // Kick off both outputs once, in parallel.
  useEffect(() => {
    if (!trend || !key) return;
    const s = stateRef.current;
    if (!s.jobId && !s.videoError && !started.has(`${key}:video`)) {
      started.add(`${key}:video`);
      startVideo();
    }
    if (!s.guide && !s.guideError && !started.has(`${key}:guide`)) {
      started.add(`${key}:guide`);
      startGuide();
    }
  }, [trend, key, startVideo, startGuide]);

  const job = state.job;
  const videoDone = job?.status === "done" || job?.status === "error";

  useEffect(() => {
    if (!state.jobId || videoDone) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getJSON<VideoJob>(`/api/create/video/${encodeURIComponent(state.jobId!)}`);
        if (cancelled) return;
        update({ job: { ...stateRef.current.job, ...next } as VideoJob });
        if (next.status === "done" || next.status === "error") return;
      } catch {}
      timer = setTimeout(poll, POLL_MS);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.jobId, videoDone, update]);

  useEffect(() => {
    if (videoDone || state.videoError) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [videoDone, state.videoError]);

  const name = trend ? displayName(trend, names) : "";

  return (
    <>
      <TopBar brandName={brand?.brandName} onEditBrand={() => router.push(`/trend/${encodeURIComponent(trendId)}`)} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <Link href={`/trend/${encodeURIComponent(trendId)}`} className="text-sm font-medium text-ink-2 hover:text-ink">
          Back to the trend
        </Link>
        <h1 className="mt-4 text-[30px] font-semibold leading-tight sm:text-[38px]">
          {brand?.brandName ?? "Your brand"} × {name || "trend"}
        </h1>
        <p className="mt-1 text-ink-2">Two ways to post it. Use the AI video as is, or film your own with the guide.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <Panel className="p-5">
            <h2 className="text-lg font-semibold">Ready-to-post video</h2>
            <p className="mt-0.5 text-sm text-ink-2">Made by AI from your brand and this trend.</p>
            <div className="relative mx-auto mt-4 aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-xl bg-ink">
              {job?.status === "done" && job.videoUrl ? (
                <video src={job.videoUrl} poster={job.thumbnailUrl} controls autoPlay loop playsInline className="h-full w-full object-contain" />
              ) : state.videoError || job?.status === "error" ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-sm text-white/80">
                  {state.videoError ?? job?.error ?? "The video couldn't be made."}
                  <Button variant="secondary" onClick={startVideo}>
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
                  <Spinner className="h-7 w-7" />
                  <p className="font-medium">{job?.status === "running" ? "Rendering your video" : "Getting started"}</p>
                  <p className="text-sm tabular-nums text-white/60">
                    {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}, usually 1–3 min
                  </p>
                </div>
              )}
            </div>
            {job?.status === "done" && job.videoUrl && (
              <a
                href={job.videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto mt-3 flex h-11 w-full max-w-[320px] items-center justify-center rounded-[10px] bg-ink font-semibold text-white hover:bg-black"
              >
                Download video
              </a>
            )}
            <p className="mx-auto mt-3 max-w-[320px] text-sm text-ink-2">
              When you upload, add {trend?.soundTitle ? <strong className="text-ink">{trend.soundTitle}</strong> : "the trend's sound"} in the
              TikTok or Instagram app.
            </p>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Film it yourself</h2>
            <p className="mb-5 mt-0.5 text-sm text-ink-2">A phone and 20 minutes. Follow the steps in order.</p>
            {state.guide ? (
              <FilmCard guide={state.guide} />
            ) : state.guideError ? (
              <ErrorNote message={`Couldn't write the guide: ${state.guideError}`} onRetry={startGuide} />
            ) : (
              <FilmCardSkeleton />
            )}
          </Panel>
        </div>

        {(state.guide || job?.status === "done") && (
          <section className="mt-6">
            <PublishPanel
              trendId={trendId}
              brief={brand ?? undefined}
              concept={state.guide?.concept ?? job?.storyboard.map((s) => s.prompt).join(" ").slice(0, 500)}
            />
          </section>
        )}

        <Panel className="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="font-semibold">Filmed your own version?</div>
            <p className="text-sm text-ink-2">Upload the draft and get the fixes that get it more views, before you post.</p>
          </div>
          <Link
            href={`/trend/${encodeURIComponent(trendId)}#draft`}
            className="inline-flex h-10 items-center rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-semibold hover:border-ink/40"
          >
            Check my draft
          </Link>
        </Panel>
      </main>
    </>
  );
}
