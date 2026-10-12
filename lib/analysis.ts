import { generateJson, trendMedia } from "./gemini";
import { analysisPrompt, guidePrompt } from "./prompts";
import { filmGuideSchema, trendAnalysisSchema } from "./schemas";
import { isSeedMode, readData, readDataOrSeed, readSeed, writeData } from "./store";
import type { BrandBrief, FilmGuide, Trend, TrendAnalysis } from "./types";

type AnalysisMap = Record<string, TrendAnalysis>;

const inFlight = new Map<string, Promise<TrendAnalysis>>();

export async function findTrend(id: string): Promise<Trend | null> {
  const trends = await readDataOrSeed<Trend[]>("trends");
  return trends?.find((t) => t.id === id) ?? null;
}

export async function cachedAnalysis(trendId: string): Promise<TrendAnalysis | null> {
  const [data, seed] = await Promise.all([readData<AnalysisMap>("analyses"), readSeed<AnalysisMap>("analyses")]);
  return isSeedMode()
    ? (seed?.[trendId] ?? data?.[trendId] ?? null)
    : (data?.[trendId] ?? seed?.[trendId] ?? null);
}

async function runAnalysis(trend: Trend): Promise<TrendAnalysis> {
  const media = await trendMedia(trend);
  const result = await generateJson<Omit<TrendAnalysis, "trendId">>(
    [...media.parts, { text: analysisPrompt(trend, media.kind) }],
    trendAnalysisSchema,
  );
  const analysis: TrendAnalysis = { ...result, trendId: trend.id };

  const all = (await readData<AnalysisMap>("analyses")) ?? {};
  await writeData("analyses", { ...all, [trend.id]: analysis });
  return analysis;
}

/** Cached analysis, or a fresh Gemini analysis (deduplicated while in flight). */
export async function getAnalysis(trend: Trend, force = false): Promise<TrendAnalysis> {
  if (!force) {
    const cached = await cachedAnalysis(trend.id);
    if (cached) return cached;
  }
  const pending = inFlight.get(trend.id);
  if (pending) return pending;

  const job = runAnalysis(trend).finally(() => inFlight.delete(trend.id));
  inFlight.set(trend.id, job);
  return job;
}

export async function createFilmGuide(
  trend: Trend,
  analysis: TrendAnalysis,
  brief: BrandBrief,
): Promise<FilmGuide> {
  const guide = await generateJson<Omit<FilmGuide, "trendId">>(
    [{ text: guidePrompt(trend, analysis, brief) }],
    filmGuideSchema,
  );
  return {
    ...guide,
    trendId: trend.id,
    shots: [...guide.shots].sort((a, b) => a.index - b.index),
    hashtags: guide.hashtags.map((h) => h.replace(/^#/, "")),
    danceBreakdown: analysis.category === "dance" ? guide.danceBreakdown : undefined,
  };
}
