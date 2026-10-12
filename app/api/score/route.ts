import { NextResponse } from "next/server";
import { findTrend } from "@/lib/analysis";
import { fail } from "@/lib/http";
import { scoreDraft } from "@/lib/viral";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BYTES = 100 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const video = form.get("video");
    const trendId = String(form.get("trendId") ?? "");
    if (!(video instanceof File)) return fail("Field 'video' is required", 400);
    if (!video.type.startsWith("video/")) return fail("Only video files are allowed", 400);
    if (video.size > MAX_BYTES) return fail("Video must be under 100 MB", 400);
    const trend = await findTrend(trendId);
    if (!trend) return fail(`Trend "${trendId}" not found`, 404);
    const brief = { brandName: String(form.get("brandName") ?? ""), product: String(form.get("product") ?? "") };
    return NextResponse.json(await scoreDraft(trend, video, video.type, brief));
  } catch (err) {
    return fail(err);
  }
}
