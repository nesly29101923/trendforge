import { NextResponse } from "next/server";
import { findTrend } from "@/lib/analysis";
import { videoPartFromBlob } from "@/lib/gemini";
import { fail } from "@/lib/http";
import { buildPublishPlan, type PublishInput } from "@/lib/publish";
import { readDataOrSeed } from "@/lib/store";
import type { BrandBrief, Trend } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

type Body = { trendId?: string; brief?: Partial<BrandBrief>; draftCaption?: string; draftHashtags?: string; concept?: string };

/** Accepts JSON, or multipart with an optional `video` file plus the same fields (`brief` as a JSON string). */
async function parse(req: Request): Promise<Body & { video?: File }> {
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) return (await req.json().catch(() => ({}))) as Body;
  const form = await req.formData();
  const text = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : undefined);
  let brief: Partial<BrandBrief> | undefined;
  try {
    brief = JSON.parse(text("brief") ?? "null") ?? undefined;
  } catch {}
  const video = form.get("video");
  return {
    trendId: text("trendId"),
    brief,
    draftCaption: text("draftCaption"),
    draftHashtags: text("draftHashtags"),
    concept: text("concept"),
    video: video instanceof File && video.size > 0 ? video : undefined,
  };
}

export async function POST(req: Request) {
  try {
    const body = await parse(req);
    if (!body.trendId) return fail("trendId is required", 400);
    if (body.video && !body.video.type.startsWith("video/")) return fail("Only video files are allowed", 400);
    if (body.video && body.video.size > MAX_VIDEO_BYTES) return fail("Video must be under 100 MB", 400);

    const trend = await findTrend(body.trendId);
    if (!trend) return fail(`Trend "${body.trendId}" not found`, 404);
    const trends = (await readDataOrSeed<Trend[]>("trends")) ?? [trend];

    const input: PublishInput = {
      brief: body.brief?.brandName?.trim() ? body.brief : undefined,
      video: body.video ? await videoPartFromBlob(body.video, body.video.type) : undefined,
      draftCaption: body.draftCaption?.slice(0, 2200),
      draftHashtags: body.draftHashtags?.slice(0, 500),
      concept: body.concept?.slice(0, 500),
    };
    return NextResponse.json(await buildPublishPlan(trend, trends, input));
  } catch (err) {
    return fail(err);
  }
}
