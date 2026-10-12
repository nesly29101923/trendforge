"use client";

import { useState } from "react";
import type { RawVideo } from "@/lib/types";
import { compact, platformLabel, tiktokVideoId } from "./format";

function SampleVideo({ video }: { video: RawVideo }) {
  const [playing, setPlaying] = useState(false);
  const embedId = video.platform === "tiktok" ? tiktokVideoId(video.url) : null;

  return (
    <div className="w-[min(70vw,240px)] shrink-0 sm:w-auto">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-line bg-surface-2">
        {playing && embedId ? (
          <iframe
            src={`https://www.tiktok.com/player/v1/${embedId}?autoplay=1&rel=0`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; fullscreen"
            title={video.caption || "Trend video"}
          />
        ) : (
          <button
            type="button"
            onClick={() => (embedId ? setPlaying(true) : window.open(video.url, "_blank", "noopener"))}
            className="group block h-full w-full"
          >
            {video.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.coverUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/40">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 pl-1 text-2xl text-black shadow-xl">
                ▶
              </span>
            </span>
            <span className="absolute bottom-2 left-2 right-2 flex justify-between text-xs font-semibold drop-shadow">
              <span>▶ {compact(video.plays)}</span>
              <span>♥ {compact(video.likes)}</span>
            </span>
          </button>
        )}
      </div>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 block truncate text-xs text-muted hover:text-fg"
      >
        Open on {platformLabel[video.platform]} ↗
      </a>
    </div>
  );
}

export function SampleVideos({ videos }: { videos: RawVideo[] }) {
  if (videos.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {videos.slice(0, 3).map((v) => (
        <SampleVideo key={v.id} video={v} />
      ))}
    </div>
  );
}
