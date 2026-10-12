import { generateJson } from "./gemini";
import { trendNamesSchema } from "./schemas";
import { readData, readDataOrSeed, readSeed, writeData } from "./store";
import type { Trend, TrendAnalysis } from "./types";

export type TrendNames = Record<string, { name: string; oneLiner: string }>;

let pending: Promise<TrendNames> | null = null;

/** Readable, brand-neutral names for today's trends ("#fypppp" → "Deadpan to dance-troupe reveal"), cached per scan. */
export async function trendNames(trends: Trend[]): Promise<TrendNames> {
  const stored = (await readDataOrSeed<TrendNames>("names")) ?? {};
  const missing = trends.filter((t) => !stored[t.id]);
  if (missing.length === 0) return stored;

  pending ??= (async () => {
    const analyses = { ...((await readSeed<Record<string, TrendAnalysis>>("analyses")) ?? {}), ...((await readData<Record<string, TrendAnalysis>>("analyses")) ?? {}) };
    const list = missing.map((t) => ({
      trendId: t.id,
      label: t.title,
      sound: t.soundTitle,
      hashtags: t.hashtags.slice(0, 6),
      captions: t.sampleVideos.slice(0, 3).map((v) => v.caption.slice(0, 140)),
      howItWorks: analyses[t.id]?.summary,
    }));
    const { trends: named } = await generateJson<{ trends: { trendId: string; name: string; oneLiner: string }[] }>(
      [
        {
          text: `Name these TikTok trends for brand marketers. For each: name = 2–5 words describing the format (sentence case, no hashtags, no emoji, never "trend"); oneLiner = one short sentence saying what creators do in it, under 14 words.\n${JSON.stringify(list)}\nReturn JSON only.`,
        },
      ],
      trendNamesSchema,
    );
    const next = { ...stored, ...Object.fromEntries(named.map((n) => [n.trendId, { name: n.name, oneLiner: n.oneLiner }])) };
    await writeData("names", next);
    return next;
  })().finally(() => (pending = null));

  return pending;
}
