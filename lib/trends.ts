import type { Platform, RawVideo, Trend, TrendStage, TrendType } from "./types";

const GENERIC_TAGS = new Set([
  "fyp", "foryou", "foryoupage", "fy", "fypシ", "viral", "trending", "trend", "trends", "reels", "shorts",
  "tiktok", "explore", "explorepage", "parati", "xyzbca", "capcut",
]);

const HOUR = 3_600_000;
const MAX_TRENDS = 12;

const slug = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "trend";

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const percentile = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return (v: number) => (values.length < 2 ? 0.5 : sorted.findIndex((x) => x >= v) / (values.length - 1));
};

interface Cluster {
  type: TrendType;
  key: string;
  title: string;
  soundTitle?: string;
  soundAuthor?: string;
  videos: RawVideo[];
}

function cluster(videos: RawVideo[]): Cluster[] {
  const bySound = new Map<string, RawVideo[]>();
  for (const v of videos) {
    if (!v.soundId) continue;
    bySound.set(v.soundId, [...(bySound.get(v.soundId) ?? []), v]);
  }

  const used = new Set<string>();
  const clusters: Cluster[] = [];
  for (const [soundId, vs] of bySound) {
    if (vs.length < 2) continue;
    const ref = vs[0];
    const commercial = vs.some((v) => v.isOriginalSound === false);
    clusters.push({
      type: commercial ? "music" : "sound",
      key: `sound-${soundId}`,
      title: ref.soundTitle ? `${ref.soundTitle}${ref.soundAuthor ? ` · ${ref.soundAuthor}` : ""}` : "Trending sound",
      soundTitle: ref.soundTitle,
      soundAuthor: ref.soundAuthor,
      videos: vs,
    });
    vs.forEach((v) => used.add(v.id));
  }

  const byTag = new Map<string, RawVideo[]>();
  for (const v of videos) {
    if (used.has(v.id)) continue;
    for (const raw of v.hashtags) {
      const tag = raw.toLowerCase().replace(/^#/, "");
      if (!tag || GENERIC_TAGS.has(tag)) continue;
      byTag.set(tag, [...(byTag.get(tag) ?? []), v]);
    }
  }
  const tagRanked = [...byTag.entries()].filter(([, vs]) => vs.length >= 2).sort((a, b) => b[1].length - a[1].length);
  for (const [tag, vs] of tagRanked) {
    const fresh = vs.filter((v) => !used.has(v.id));
    if (fresh.length < 2) continue;
    clusters.push({ type: "format", key: `tag-${tag}`, title: `#${tag}`, videos: fresh });
    fresh.forEach((v) => used.add(v.id));
  }
  return clusters;
}

export function buildTrends(videos: RawVideo[], now = Date.now()): Trend[] {
  const clusters = cluster(videos);
  if (!clusters.length) return [];

  const stats = clusters.map((c) => {
    const hours = c.videos.map((v) => Math.max(1, (now - Date.parse(v.createdAt)) / HOUR));
    const plays = c.videos.reduce((s, v) => s + v.plays, 0);
    const interactions = c.videos.reduce((s, v) => s + v.likes + v.comments + v.shares, 0);
    return {
      velocity: median(c.videos.map((v, i) => v.plays / hours[i])),
      recency: hours.filter((h) => h <= 72).length / hours.length,
      engagement: plays ? interactions / plays : 0,
      plays,
    };
  });

  const velocityPct = percentile(stats.map((s) => s.velocity));
  const engagementPct = percentile(stats.map((s) => s.engagement));
  const maxCount = Math.max(...clusters.map((c) => c.videos.length));

  return clusters
    .map((c, i) => {
      const s = stats[i];
      const velocity = velocityPct(s.velocity);
      const engagement = engagementPct(s.engagement);
      const saturation = maxCount > 1 ? (c.videos.length - 1) / (maxCount - 1) : 0;
      const momentumScore = Math.round(
        100 * (0.35 * velocity + 0.3 * s.recency + 0.2 * engagement + 0.15 * (1 - saturation)),
      );
      const stage: TrendStage =
        s.recency > 0.5 && saturation < 0.5 ? "rising" : velocity >= 0.5 && saturation >= 0.5 ? "peaking" : "fading";
      const hashtags = [...new Set(c.videos.flatMap((v) => v.hashtags.map((h) => h.toLowerCase())))]
        .filter((h) => !GENERIC_TAGS.has(h))
        .slice(0, 8);
      const trend: Trend = {
        id: slug(c.key),
        type: c.type,
        title: c.title,
        soundTitle: c.soundTitle,
        soundAuthor: c.soundAuthor,
        hashtags,
        platforms: [...new Set(c.videos.map((v) => v.platform))] as Platform[],
        videoCount: c.videos.length,
        totalPlays: s.plays,
        avgEngagementRate: Number(s.engagement.toFixed(4)),
        momentumScore,
        stage,
        sampleVideos: [...c.videos].sort((a, b) => b.plays - a.plays).slice(0, 5),
        updatedAt: new Date(now).toISOString(),
      };
      return trend;
    })
    .sort((a, b) => b.momentumScore - a.momentumScore)
    .slice(0, MAX_TRENDS);
}

export const isEarlySignal = (t: Trend) => t.stage === "rising" && t.momentumScore >= 60 && t.videoCount <= 4;
