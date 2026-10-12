import { cachedAnalysis } from "./analysis";
import { generateJson, videoPartFromBlob } from "./gemini";
import { viralScoreSchema } from "./schemas";
import type { BrandBrief, Trend, TrendAnalysis, ViralScore } from "./types";

export const VIRAL_CRITERIA = [
  "Hook (first 1.5 s)",
  "Trend fidelity",
  "Beat sync & pacing",
  "Retention / loopability",
  "Visual quality",
  "Brand integration",
  "Call to action & caption",
];

const fmt = (n: number) => Intl.NumberFormat("en", { notation: "compact" }).format(n);

function viralPrompt(t: Trend, a: TrendAnalysis | null, brief?: Partial<BrandBrief>) {
  return `You are a strict TikTok growth analyst. Watch this DRAFT ad video from a brand that wants to ride the trend below.
Trend "${t.title}" (type: ${t.type}; ${t.videoCount} videos, ${fmt(t.totalPlays)} plays, momentum ${t.momentumScore}/100, stage ${t.stage}${t.soundTitle ? `; sound: ${t.soundTitle}` : ""}; hashtags: ${t.hashtags.map((h) => `#${h}`).join(" ") || "none"}).
${a ? `How the trend works: ${a.summary} Hook: ${a.hook}. Structure: ${a.structure.map((s) => `${s.t}: ${s.beat}`).join("; ")}. Audio: ${a.audioNotes}. Why it works: ${a.whyItWorks.join("; ")}.` : ""}
${brief?.brandName ? `Brand: ${brief.brandName}${brief.product ? `, product: ${brief.product}` : ""}.` : ""}
Score how likely it is to get views as it is now, 0–100. Be honest: most first drafts score 35–65.
Breakdown: exactly these criteria, in this order, each 0–10 with a one-line note: ${VIRAL_CRITERIA.join("; ")}.
Then 3–6 concrete fixes ordered by impact, each with a timecode where relevant, what to change, and the expected impact on
views/retention. scoreAfterFixes is the realistic score if every fix is applied (never 100). verdict is one punchy sentence.`;
}

const clamp = (n: number, max = 100) => Math.round(Math.min(max, Math.max(0, n)));

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

/** Benchmark = median plays of the trend's top videos, scaled by a convex function of the score. */
export function expectedViews(trend: Trend, score: number) {
  const benchmark = median(trend.sampleVideos.map((v) => v.plays)) || trend.totalPlays / Math.max(1, trend.videoCount);
  const mid = benchmark * (0.05 + 1.2 * (score / 100) ** 2);
  return { low: Math.round(mid * 0.5), high: Math.round(mid * 1.5) };
}

export async function scoreDraft(trend: Trend, video: Blob, mimeType: string, brief?: Partial<BrandBrief>): Promise<ViralScore> {
  const analysis = await cachedAnalysis(trend.id);
  const raw = await generateJson<Omit<ViralScore, "trendId" | "expectedViews">>(
    [await videoPartFromBlob(video, mimeType), { text: viralPrompt(trend, analysis, brief) }],
    viralScoreSchema,
  );
  const score = clamp(raw.score);
  const scoreAfterFixes = Math.max(score, clamp(raw.scoreAfterFixes, 99));
  const order = { high: 0, medium: 1, low: 2 };
  return {
    trendId: trend.id,
    score,
    scoreAfterFixes,
    verdict: raw.verdict,
    breakdown: VIRAL_CRITERIA.map((criterion, i) => {
      const b = raw.breakdown[i] ?? { score: Math.round(score / 10), note: "" };
      return { criterion, score: clamp(b.score, 10), note: b.note };
    }),
    fixes: [...raw.fixes].sort((a, b) => order[a.priority] - order[b.priority]),
    expectedViews: { before: expectedViews(trend, score), after: expectedViews(trend, scoreAfterFixes) },
  };
}
