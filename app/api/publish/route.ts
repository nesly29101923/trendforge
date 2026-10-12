import { NextResponse } from "next/server";
import { findTrend } from "@/lib/analysis";
import { fail, readBody } from "@/lib/http";
import { buildPublishPlan, type PublishInput } from "@/lib/publish";
import { readDataOrSeed } from "@/lib/store";
import type { Trend } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await readBody<PublishInput & { trendId: string }>(req);
  if (!body.trendId) return fail("trendId is required", 400);
  if (!body.brief?.brandName?.trim() || !body.brief.product?.trim()) {
    return fail("brief.brandName and brief.product are required", 400);
  }
  try {
    const trend = await findTrend(body.trendId);
    if (!trend) return fail(`Trend "${body.trendId}" not found`, 404);
    const trends = (await readDataOrSeed<Trend[]>("trends")) ?? [trend];
    return NextResponse.json(
      await buildPublishPlan(trend, trends, {
        brief: { ...body.brief, tone: body.brief.tone ?? "fun", goal: body.brief.goal ?? "awareness", audience: body.brief.audience ?? "" },
        draftCaption: body.draftCaption?.slice(0, 2200),
        draftHashtags: body.draftHashtags?.slice(0, 500),
        concept: body.concept?.slice(0, 500),
      }),
    );
  } catch (err) {
    return fail(err);
  }
}
