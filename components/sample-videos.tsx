"use client";

import { useState } from "react";
import type { RawVideo } from "@/lib/types";
import { compact, platformLabel, tiktokVideoId } from "./format";
import { Cover, cx } from "./ui";

/** The trend's top videos: one large player and thumbnails to switch between examples. */
export function SampleVideos({ videos }: { videos: RawVideo[] }) {
  const list = videos.slice(0, 4);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const video = list[active];
  if (!video) return null;
  const embedId = video.platform === "tiktok" ? tiktokVideoId(video.url) : null;

  return (
    <div>
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl bg-black lg:max-w-[320px]">
        {playing && embedId ? (
          <iframe
            key={embedId}
            src={`https://www.tiktok.com/player/v1/${embedId}?autoplay=1&rel=0&description=0`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; fullscreen"
            title="Trend example video"
          />
        ) : (
          <button
            type="button"
            onClick={() => (embedId ? setPlaying(true) : window.open(video.url, "_blank", "noopener"))}
            className="group absolute inset-0"
            aria-label="Play example video"
          >
            <Cover src={video.coverUrl} className="h-full w-full" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105">
                <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden>
                  <path d="M2 1.5v17L17 10z" fill="var(--color-ink)" />
                </svg>
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-10 text-left text-sm font-medium text-white">
              {compact(video.plays)} plays, {compact(video.likes)} likes
            </span>
          </button>
        )}
      </div>

      {list.length > 1 && (
        <div className="mx-auto mt-3 flex max-w-[240px] justify-center gap-2 lg:max-w-[320px]">
          {list.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActive(i);
                setPlaying(false);
              }}
              className={cx("w-14 overflow-hidden rounded-lg ring-2 transition", i === active ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100")}
              aria-label={`Example ${i + 1}`}
            >
              <Cover src={v.coverUrl} className="aspect-[3/4] w-full" />
            </button>
          ))}
        </div>
      )}
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto mt-2 block max-w-[320px] text-center text-sm text-muted hover:text-ink"
      >
        Open on {platformLabel[video.platform]}
      </a>
    </div>
  );
}
