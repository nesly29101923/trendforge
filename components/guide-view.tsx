"use client";

import { useState } from "react";
import type { BrandBrief, FilmGuide } from "@/lib/types";
import { Card, SectionTitle } from "./ui";

export function guideToText(guide: FilmGuide, title: string, brief: BrandBrief) {
  const lines = [
    `${brief.brandName} × ${title}`,
    `Concept: ${guide.concept}`,
    `Duration: ${guide.totalDurationSec}s`,
    `Sound: ${guide.soundInstruction}`,
    "",
    "SETUP",
    `Location: ${guide.setup.location}`,
    `Lighting: ${guide.setup.lighting}`,
    `Camera: ${guide.setup.camera}`,
    `Wardrobe: ${guide.setup.wardrobe}`,
    `People: ${guide.setup.people}`,
    `Props: ${guide.setup.props.join(", ")}`,
    "",
    "SHOTS",
    ...guide.shots.flatMap((s) => [
      `${s.index}. [${s.timecode}]${s.onBeat ? ` (${s.onBeat})` : ""} ${s.angle}, ${s.framing}, ${s.cameraMovement}`,
      `   Action: ${s.action}`,
      s.performanceNotes && `   Performance: ${s.performanceNotes}`,
      s.onScreenText && `   On-screen text: "${s.onScreenText}"`,
      s.transition && `   Transition: ${s.transition}`,
    ]),
    ...(guide.danceBreakdown?.length
      ? ["", "DANCE COUNTS", ...guide.danceBreakdown.map((d) => `${d.count}: ${d.move}`)]
      : []),
    "",
    `Caption: ${guide.caption}`,
    `Hashtags: ${guide.hashtags.map((h) => `#${h}`).join(" ")}`,
    "",
    "POSTING TIPS",
    ...guide.postingTips.map((t) => `- ${t}`),
  ];
  return lines.filter((l): l is string => typeof l === "string").join("\n");
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={className ?? "rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function SetupItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3 ring-1 ring-line">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {icon} {label}
      </div>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "cyan" }) {
  return (
    <span
      className={
        tone === "cyan"
          ? "rounded-md bg-cyan/10 px-2 py-0.5 text-xs font-semibold text-cyan"
          : "rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-fg/80 ring-1 ring-white/10"
      }
    >
      {children}
    </span>
  );
}

export function GuideView({ guide, title, brief }: { guide: FilmGuide; title: string; brief: BrandBrief }) {
  const fullText = guideToText(guide, title, brief);

  return (
    <div className="space-y-5">
      <Card className="border-white/10 bg-gradient-to-br from-cyan/10 via-surface to-pink/10">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-fg">🎬 Film It Yourself</span>
          <span>{guide.totalDurationSec}s · 9:16 · {guide.shots.length} shots</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {brief.brandName} <span className="text-muted">×</span> <span className="text-gradient">{title}</span>
        </h1>
        <p className="mt-3 text-lg leading-relaxed">{guide.concept}</p>
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <CopyButton
            text={fullText}
            label="Copy as text"
            className="rounded-xl bg-fg px-4 py-2 text-sm font-semibold text-bg hover:opacity-90"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-white/20"
          >
            Download PDF
          </button>
        </div>
      </Card>

      <div className="flex gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4">
        <span className="text-xl" aria-hidden>♫</span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber">Sound</div>
          <p className="mt-0.5 leading-relaxed">{guide.soundInstruction}</p>
        </div>
      </div>

      <Card>
        <SectionTitle icon="🎥">Setup</SectionTitle>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <SetupItem icon="📍" label="Location" value={guide.setup.location} />
          <SetupItem icon="💡" label="Lighting" value={guide.setup.lighting} />
          <SetupItem icon="📱" label="Camera" value={guide.setup.camera} />
          <SetupItem icon="👕" label="Wardrobe" value={guide.setup.wardrobe} />
          <SetupItem icon="🧑‍🤝‍🧑" label="People" value={guide.setup.people} />
          <SetupItem icon="🧰" label="Props" value={guide.setup.props.join(", ") || "None"} />
        </div>
      </Card>

      <div>
        <SectionTitle icon="🎞">Shot list</SectionTitle>
        <ol className="space-y-3">
          {guide.shots.map((s) => (
            <li key={s.index} className="flex gap-3 rounded-2xl border border-line bg-surface p-4 sm:gap-4">
              <div className="flex shrink-0 flex-col items-center">
                <span className="brand-gradient grid h-9 w-9 place-items-center rounded-full text-sm font-black text-black">
                  {s.index}
                </span>
                <span className="mt-1.5 whitespace-nowrap font-mono text-[11px] font-semibold text-cyan">{s.timecode}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Tag>{s.angle}</Tag>
                  <Tag>{s.framing}</Tag>
                  <Tag>{s.cameraMovement}</Tag>
                  {s.onBeat && <Tag tone="cyan">♪ {s.onBeat}</Tag>}
                </div>
                <p className="font-medium leading-relaxed">{s.action}</p>
                {s.performanceNotes && (
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-fg/80">Performance: </span>
                    {s.performanceNotes}
                  </p>
                )}
                {s.onScreenText && (
                  <p className="inline-block rounded-lg bg-black/40 px-2.5 py-1 text-sm font-semibold ring-1 ring-white/10">
                    “{s.onScreenText}”
                  </p>
                )}
                {s.transition && <p className="text-xs text-muted">↪ Transition: {s.transition}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {guide.danceBreakdown && guide.danceBreakdown.length > 0 && (
        <Card>
          <SectionTitle icon="💃">Dance counts</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {guide.danceBreakdown.map((d, i) => (
              <div key={i} className="flex gap-3 rounded-xl bg-surface-2 p-3 ring-1 ring-line">
                <span className="shrink-0 font-mono text-sm font-bold text-pink">{d.count}</span>
                <span className="text-sm leading-relaxed">{d.move}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon="✍️">Caption</SectionTitle>
            <CopyButton text={`${guide.caption}\n\n${guide.hashtags.map((h) => `#${h}`).join(" ")}`} label="Copy" />
          </div>
          <p className="leading-relaxed">{guide.caption}</p>
          <p className="mt-3 flex flex-wrap gap-x-2 text-sm text-cyan">
            {guide.hashtags.map((h) => (
              <span key={h}>#{h}</span>
            ))}
          </p>
        </Card>
        <Card>
          <SectionTitle icon="🚀">Posting tips</SectionTitle>
          <ul className="space-y-2">
            {guide.postingTips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-pink">→</span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
