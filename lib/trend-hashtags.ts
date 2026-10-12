import { cachedAnalysis } from "./analysis";
import { generateJson } from "./gemini";
import { hashtagStats } from "./hashtags";
import { trendHashtagsSchema } from "./schemas";
import { readData, writeData } from "./store";
import type { HashtagStat, Trend } from "./types";

export interface TrendHashtags {
  trendId: string;
  hashtags: { tag: string; role: "trend" | "broad" | "niche" | "community"; why: string }[];
  caption: string;
  tip: string;
}

const fmt = (n: number) => Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const CACHE = "trend-hashtags";
const FILLER = /^(fy+p+|foryou|parati|viral|trending|trend$|xyz|explore)/;

function prompt(trend: Trend, stats: HashtagStat[], summary?: string, category?: string) {
  return `You are a TikTok/Reels growth strategist. Someone just filmed their own video in this trend and wants to post it.
Recommend the hashtags to share it with. No brand is involved; it is a creator's own take on the trend.
Trend: "${trend.title}" (type ${trend.type}${category ? `, format ${category}` : ""}, stage ${trend.stage}, momentum ${trend.momentumScore}/100${trend.soundTitle ? `, sound "${trend.soundTitle}"` : ""}).
${summary ? `How the trend works: ${summary}` : ""}
Real hashtag data scraped today (tag | videos | median plays | engagement | tier):
${stats.map((s) => `#${s.tag} | ${s.videos} | ${fmt(s.medianPlays)} | ${(s.engagementRate * 100).toFixed(1)}% | ${s.tier}`).join("\n")}
Return 6–8 hashtags: 2–3 "trend" (the trend's own tags, so the algorithm groups the video with the trend), 1–2 "broad" (big reach),
2 "niche" (the content category, e.g. makeup, dance, comedy), 1 "community" (an audience that engages with this format).
Prefer tags with strong data; never fyp/foryou/viral filler. Each "why" is one short line, citing the data when possible.
caption: one ready-to-post caption for this trend (max 100 characters, hook first, no hashtags).
tip: one sentence on how to post it (sound, timing or first comment).`;
}

export async function trendHashtags(trend: Trend, trends: Trend[]): Promise<TrendHashtags> {
  const cache = (await readData<Record<string, TrendHashtags>>(CACHE)) ?? {};
  if (cache[trend.id]) return cache[trend.id];
  const analysis = await cachedAnalysis(trend.id);
  const raw = await generateJson<Omit<TrendHashtags, "trendId">>(
    [{ text: prompt(trend, hashtagStats(trends, trend).slice(0, 18), analysis?.summary, analysis?.category) }],
    trendHashtagsSchema,
  );
  const seen = new Set<string>();
  const result: TrendHashtags = {
    trendId: trend.id,
    caption: raw.caption,
    tip: raw.tip,
    hashtags: raw.hashtags
      .map((h) => ({ ...h, tag: h.tag.replace(/^#/, "").replace(/\s+/g, "").toLowerCase() }))
      .filter((h) => h.tag && !FILLER.test(h.tag) && !seen.has(h.tag) && !!seen.add(h.tag))
      .slice(0, 8),
  };
  await writeData(CACHE, { ...cache, [trend.id]: result });
  return result;
}
