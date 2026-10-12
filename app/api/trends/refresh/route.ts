import { NextResponse } from "next/server";
import { scrapeTikTok } from "@/lib/apify";
import { isSeedMode, readSeed, writeData } from "@/lib/store";
import { buildTrends } from "@/lib/trends";
import type { Trend } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (isSeedMode()) return NextResponse.json((await readSeed<Trend[]>("trends")) ?? []);
  try {
    const body = await req.json().catch(() => ({}));
    const queries: string[] | undefined = Array.isArray(body.queries) ? body.queries : undefined;
    const videos = await scrapeTikTok(queries);
    const trends = buildTrends(videos);
    await writeData(`raw-${new Date().toISOString().slice(0, 10)}`, videos);
    await writeData("trends", trends);
    return NextResponse.json(trends);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Refresh failed" }, { status: 500 });
  }
}
