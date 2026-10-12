import type { Platform, Trend, TrendStage } from "@/lib/types";

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

export const platformLabel: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Reels",
  youtube: "Shorts",
};

export function tiktokVideoId(url: string) {
  return url.match(/tiktok\.com\/.*\/video\/(\d+)/)?.[1] ?? null;
}

const DAY = 86_400_000;
const weekday = (d: Date) => d.toLocaleDateString("en", { weekday: "short" });

export interface PostingWindow {
  open: boolean;
  urgent: boolean;
  label: string; // "Post by Thu", "Post within 48 h", "Window closed"
  detail: string;
  startDay: number; // offset from today, 0–6
  endDay: number;
}

/** When to post, from the trend's lifecycle stage (the analysis' prediction wins when available). */
export function postingWindow(trend: Trend, stage: TrendStage = trend.stage): PostingWindow {
  const today = new Date();
  if (stage === "rising") {
    const by = new Date(today.getTime() + 4 * DAY);
    return { open: true, urgent: false, label: `Post by ${weekday(by)}`, detail: "Still early. Best results in the next 4 days.", startDay: 0, endDay: 4 };
  }
  if (stage === "peaking") {
    return { open: true, urgent: true, label: "Post within 48 h", detail: "At its peak now. Late posts get less reach.", startDay: 0, endDay: 1 };
  }
  return { open: false, urgent: false, label: "Window closed", detail: "Past its peak. Only worth it with a strong twist.", startDay: 0, endDay: -1 };
}
