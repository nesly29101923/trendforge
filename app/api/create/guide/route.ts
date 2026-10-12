import { NextResponse } from "next/server";
import { createFilmGuide, findTrend, getAnalysis } from "@/lib/analysis";
import { fail, readBody } from "@/lib/http";
import type { BrandBrief, Trend, TrendAnalysis } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await readBody<{ trendId: string; trend: Trend; brief: BrandBrief; analysis: TrendAnalysis }>(req);
  const trendId = body.trendId ?? body.trend?.id;
  const brief = body.brief;

  if (!trendId) return fail("trendId is required", 400);
  if (!brief?.brandName?.trim() || !brief.product?.trim()) return fail("brief.brandName and brief.product are required", 400);

  try {
    const trend = (await findTrend(trendId)) ?? (body.trend?.id === trendId ? body.trend : null);
    if (!trend) return fail(`Trend "${trendId}" not found`, 404);

    const analysis = body.analysis?.trendId === trendId ? body.analysis : await getAnalysis(trend);
    const guide = await createFilmGuide(trend, analysis, {
      ...brief,
      audience: brief.audience?.trim() || "general social media audience",
      tone: brief.tone ?? "fun",
      goal: brief.goal ?? "awareness",
    });
    return NextResponse.json(guide);
  } catch (err) {
    return fail(err);
  }
}
