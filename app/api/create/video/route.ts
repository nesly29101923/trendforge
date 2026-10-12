import { NextResponse } from "next/server";
import { DURATION_SEC, startVideo, type Quality } from "@/lib/fal";
import { isSeedMode, readDataOrSeed, readSeed } from "@/lib/store";
import { buildStoryboard, mergeShots } from "@/lib/storyboard";
import type { BrandBrief, Trend, TrendAnalysis, VideoJob } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  trend?: Trend;
  trendId?: string;
  brief: BrandBrief;
  analysis?: TrendAnalysis;
  quality?: Quality;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (isSeedMode()) {
      const demo = await readSeed<VideoJob>("video-demo");
      if (demo) return NextResponse.json(demo);
    }
    if (!body.brief?.brandName || !body.brief?.product) {
      return NextResponse.json({ error: "brief.brandName and brief.product are required" }, { status: 400 });
    }

    const trend =
      body.trend ?? ((await readDataOrSeed<Trend[]>("trends")) ?? []).find((t) => t.id === body.trendId);
    if (!trend) return NextResponse.json({ error: "Trend not found" }, { status: 404 });

    const analysis =
      body.analysis ?? (await readDataOrSeed<Record<string, TrendAnalysis>>("analyses"))?.[trend.id] ?? null;
    const quality: Quality = body.quality === "hero" ? "hero" : "fast";
    const storyboard = await buildStoryboard(trend, body.brief, analysis, DURATION_SEC[quality]);
    const { jobId, model } = await startVideo({
      trendId: trend.id,
      prompt: mergeShots(storyboard),
      quality,
      imageUrl: body.brief.productImageUrl,
    });

    const job: VideoJob = { jobId, trendId: trend.id, status: "queued", storyboard, model };
    return NextResponse.json(job);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Video request failed" }, { status: 500 });
  }
}
