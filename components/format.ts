import type { Platform, Trend } from "@/lib/types";

export const compact = (n: number) =>
  Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** Rising trend with high momentum that few creators have jumped on yet. */
export const isEarlySignalTrend = (t: Trend) => t.stage === "rising" && t.momentumScore >= 60 && t.videoCount <= 8;

export const platformLabel: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Reels",
  youtube: "Shorts",
};

export function tiktokVideoId(url: string) {
  return url.match(/tiktok\.com\/.*\/video\/(\d+)/)?.[1] ?? null;
}
