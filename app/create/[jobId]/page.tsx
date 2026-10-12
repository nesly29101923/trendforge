"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { session } from "@/components/api";
import type { GuideSession, VideoSession } from "@/components/brief-form";
import { GuideView } from "@/components/guide-view";
import { ErrorBox } from "@/components/ui";
import { VideoResult } from "@/components/video-result";

export default function CreateResult() {
  const params = useParams<{ jobId: string }>();
  const jobId = decodeURIComponent(params.jobId);
  const isGuide = jobId.startsWith("guide-");
  const [ready, setReady] = useState(false);
  const [guide, setGuide] = useState<GuideSession | null>(null);
  const [video, setVideo] = useState<VideoSession | null>(null);

  useEffect(() => {
    if (isGuide) setGuide(session.get<GuideSession>(jobId));
    else setVideo(session.get<VideoSession>(`job:${jobId}`));
    setReady(true);
  }, [jobId, isGuide]);

  const backHref = guide?.trend.id ?? video?.trend.id;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-5 sm:pt-8">
      <Link href={backHref ? `/trend/${encodeURIComponent(backHref)}` : "/"} className="no-print mb-4 inline-block text-sm text-muted hover:text-fg">
        ← {backHref ? "Back to trend" : "Trend Radar"}
      </Link>

      {!ready ? null : isGuide ? (
        guide ? (
          <GuideView guide={guide.guide} title={guide.trend.title} brief={guide.brief} />
        ) : (
          <ErrorBox message="This guide is no longer in this browser session. Generate it again from the trend page." />
        )
      ) : (
        <VideoResult jobId={jobId} initial={video} />
      )}
    </main>
  );
}
