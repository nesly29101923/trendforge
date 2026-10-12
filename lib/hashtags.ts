import type { CaptionInsights, HashtagStat, RawVideo, Trend } from "./types";

const GENERIC = new Set(["fyp", "foryou", "foryoupage", "fy", "fypシ", "viral", "trending", "xyzbca", "parati", "explore"]);
const CTA = /\b(comment|follow|link in bio|save|share|tag|duet|stitch|shop|try|order|tap|click|dm)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const norm = (t: string) => t.toLowerCase().replace(/^#/, "").trim();

function uniqueVideos(trends: Trend[]) {
  const seen = new Map<string, { video: RawVideo; trendIds: Set<string> }>();
  for (const t of trends)
    for (const v of t.sampleVideos) {
      const entry = seen.get(v.id) ?? { video: v, trendIds: new Set<string>() };
      entry.trendIds.add(t.id);
      seen.set(v.id, entry);
    }
  return [...seen.values()];
}

/** Ranks hashtags by real reach and engagement across every scraped trend; the focus trend's own tags come first. */
export function hashtagStats(trends: Trend[], focus: Trend): HashtagStat[] {
  const byTag = new Map<string, { plays: number[]; inter: number; total: number; trends: Set<string> }>();
  for (const { video, trendIds } of uniqueVideos(trends)) {
    for (const raw of new Set(video.hashtags.map(norm))) {
      if (!raw) continue;
      const e = byTag.get(raw) ?? { plays: [], inter: 0, total: 0, trends: new Set<string>() };
      e.plays.push(video.plays);
      e.inter += video.likes + video.comments + video.shares;
      e.total += video.plays;
      trendIds.forEach((id) => e.trends.add(id));
      byTag.set(raw, e);
    }
  }
  const focusTags = new Set([...focus.hashtags, ...focus.sampleVideos.flatMap((v) => v.hashtags)].map(norm));
  const rows = [...byTag.entries()].map(([tag, e]) => ({
    tag,
    videos: e.plays.length,
    trends: e.trends.size,
    medianPlays: Math.round(median(e.plays)),
    engagementRate: e.total ? e.inter / e.total : 0,
  }));
  const maxLog = Math.log10(Math.max(10, ...rows.map((r) => r.medianPlays)));
  const maxEng = Math.max(0.0001, ...rows.map((r) => r.engagementRate));
  return rows
    .map((r) => {
      const reach = Math.log10(Math.max(1, r.medianPlays)) / maxLog;
      const score = Math.round(100 * (0.6 * reach + 0.3 * (r.engagementRate / maxEng) + 0.1 * Math.min(1, r.videos / 5)));
      const tier: HashtagStat["tier"] = GENERIC.has(r.tag) || r.trends >= 3 ? "broad" : focusTags.has(r.tag) ? "trend" : "niche";
      return { ...r, engagementRate: Number(r.engagementRate.toFixed(4)), score, tier };
    })
    .sort((a, b) => Number(focusTags.has(b.tag)) - Number(focusTags.has(a.tag)) || b.score - a.score)
    .slice(0, 24);
}

/** What the captions of the best-performing videos have in common. */
export function captionInsights(trends: Trend[], focus: Trend): CaptionInsights {
  const all = uniqueVideos(trends).map((e) => e.video);
  const pool = [...focus.sampleVideos, ...all.filter((v) => !focus.sampleVideos.some((s) => s.id === v.id))];
  const top = [...pool].sort((a, b) => b.plays - a.plays).slice(0, Math.max(5, Math.ceil(pool.length / 2)));
  const text = (c: string) => c.replace(/#[^\s#]+/g, "").trim();
  const share = (f: (v: RawVideo) => boolean) => (top.length ? Number((top.filter(f).length / top.length).toFixed(2)) : 0);
  const hours = new Map<number, number>();
  for (const v of top) {
    const h = new Date(v.createdAt).getUTCHours();
    if (!Number.isNaN(h)) hours.set(h, (hours.get(h) ?? 0) + v.plays);
  }
  return {
    sampleSize: top.length,
    medianLength: Math.round(median(top.map((v) => text(v.caption).length))),
    medianHashtags: Math.round(median(top.map((v) => v.hashtags.length))),
    questionShare: share((v) => v.caption.includes("?")),
    emojiShare: share((v) => EMOJI.test(v.caption)),
    ctaShare: share((v) => CTA.test(v.caption)),
    bestHours: [...hours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => h),
    topCaptions: focus.sampleVideos
      .filter((v) => v.caption.trim())
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 3)
      .map((v) => ({ caption: v.caption.slice(0, 220), plays: v.plays })),
  };
}
