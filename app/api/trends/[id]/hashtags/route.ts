import { NextResponse } from "next/server";
import { findTrend } from "@/lib/analysis";
import { hashtagStats } from "@/lib/hashtags";
import { fail } from "@/lib/http";
import { readDataOrSeed } from "@/lib/store";
import { trendHashtags } from "@/lib/trend-hashtags";
import type { Trend } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

async function load(id: string) {
  const trend = await findTrend(id);
  const trends = (await readDataOrSeed<Trend[]>("trends")) ?? (trend ? [trend] : []);
  return { trend, trends };
}

/** Instant, data-only ranking of hashtags for this trend. */
export async function GET(_req: Request, { params }: Ctx) {
  const { trend, trends } = await load((await params).id);
  if (!trend) return fail("Trend not found", 404);
  return NextResponse.json(hashtagStats(trends, trend).slice(0, 12));
}

/** AI-picked, ready-to-copy hashtag set + caption (cached per trend). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { trend, trends } = await load((await params).id);
    if (!trend) return fail("Trend not found", 404);
    return NextResponse.json(await trendHashtags(trend, trends));
  } catch (err) {
    return fail(err);
  }
}
