import { NextResponse } from "next/server";
import { pollVideo } from "@/lib/fal";
import { readSeed } from "@/lib/store";
import type { VideoJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const demo = await readSeed<VideoJob>("video-demo");
  if (demo && demo.jobId === jobId) return NextResponse.json(demo);
  try {
    return NextResponse.json(await pollVideo(jobId));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid job id" }, { status: 500 });
  }
}
