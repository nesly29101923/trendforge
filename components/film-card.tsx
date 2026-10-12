"use client";

import { useState } from "react";
import type { FilmGuide } from "@/lib/types";
import { Button, Skeleton, cx } from "./ui";

function guideText(g: FilmGuide) {
  return [
    g.concept,
    "",
    `Sound: ${g.soundInstruction}`,
    "",
    ...g.shots.map((s, i) => `${i + 1}. ${s.timecode}: ${s.action}${s.onScreenText ? ` (text: "${s.onScreenText}")` : ""}`),
    "",
    `Setup: ${g.setup.location}. ${g.setup.lighting}. ${g.setup.camera}.`,
    "",
    `Caption: ${g.caption}`,
    g.hashtags.map((h) => `#${h}`).join(" "),
  ].join("\n");
}

/** The "film it yourself" half of the result: a short plan anyone on the team can follow. */
export function FilmCard({ guide }: { guide: FilmGuide }) {
  const [details, setDetails] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  const caption = `${guide.caption}\n\n${guide.hashtags.map((h) => `#${h}`).join(" ")}`;

  return (
    <div className="space-y-6">
      <p className="text-[17px] leading-relaxed">{guide.concept}</p>

      <ol className="space-y-4">
        {guide.shots.map((s, i) => (
          <li key={s.index} className="grid grid-cols-[28px_1fr] gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
            <div>
              <div className="text-sm tabular-nums text-muted">{s.timecode}</div>
              <p className="leading-relaxed">{s.action}</p>
              {s.onScreenText && <p className="mt-1 text-sm text-ink-2">Text on screen: “{s.onScreenText}”</p>}
              {details && (
                <p className="mt-1 text-sm text-ink-2">
                  <span className="capitalize">{s.framing}</span>, {s.angle}, {s.cameraMovement}.{s.performanceNotes && ` ${s.performanceNotes}`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {details && (
        <div className="space-y-2 rounded-xl bg-canvas p-4 text-sm leading-relaxed text-ink-2">
          <p>
            <span className="font-medium text-ink">Where: </span>
            {guide.setup.location}
          </p>
          <p>
            <span className="font-medium text-ink">Light: </span>
            {guide.setup.lighting}
          </p>
          <p>
            <span className="font-medium text-ink">Camera: </span>
            {guide.setup.camera}
          </p>
          <p>
            <span className="font-medium text-ink">Who: </span>
            {guide.setup.people}. {guide.setup.wardrobe}
          </p>
          {guide.setup.props.length > 0 && (
            <p>
              <span className="font-medium text-ink">Props: </span>
              {guide.setup.props.join(", ")}
            </p>
          )}
          {guide.danceBreakdown?.map((d, i) => (
            <p key={i}>
              <span className="font-medium tabular-nums text-ink">{d.count}: </span>
              {d.move}
            </p>
          ))}
        </div>
      )}
      <button onClick={() => setDetails((d) => !d)} className="text-sm font-medium text-accent hover:underline">
        {details ? "Hide camera and setup details" : "Show camera and setup details"}
      </button>

      <div className="rounded-xl border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-2">Caption</span>
          <button onClick={() => copy("caption", caption)} className="text-sm font-medium text-accent hover:underline">
            {copied === "caption" ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 leading-relaxed">{guide.caption}</p>
        <p className="mt-2 text-sm text-accent">{guide.hashtags.map((h) => `#${h}`).join(" ")}</p>
      </div>

      <Button variant="secondary" onClick={() => copy("all", guideText(guide))}>
        {copied === "all" ? "Copied" : "Copy the whole guide"}
      </Button>
    </div>
  );
}

export function FilmCardSkeleton() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">Writing your filming guide. About 20 seconds.</p>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cx("grid grid-cols-[28px_1fr] gap-3", i === 0 && "mt-6")}>
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
