import { NextResponse } from "next/server";
import { findTrend, getAnalysis } from "@/lib/analysis";
import { fail, readBody } from "@/lib/http";
import type { Trend } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readBody<{ trend: Trend; force: boolean }>(req);

  try {
    const trend = (await findTrend(id)) ?? (body.trend?.id === id ? body.trend : null);
    if (!trend) return fail(`Trend "${id}" not found`, 404);
    return NextResponse.json(await getAnalysis(trend, body.force === true));
  } catch (err) {
    return fail(err);
  }
}
