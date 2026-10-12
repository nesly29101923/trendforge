import { NextResponse } from "next/server";
import { kindOf } from "@/lib/audience";
import { fail } from "@/lib/http";
import { readData, readDataOrSeed, readSeed } from "@/lib/store";
import type { ContentKind, Trend, TrendAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

/** trendId → content kind (dance, product, …) for the Trend Radar filters. */
export async function GET() {
  try {
    const [trends, seed, data] = await Promise.all([
      readDataOrSeed<Trend[]>("trends"),
      readSeed<Record<string, TrendAnalysis>>("analyses"),
      readData<Record<string, TrendAnalysis>>("analyses"),
    ]);
    const analyses = { ...(seed ?? {}), ...(data ?? {}) };
    const kinds: Record<string, ContentKind> = Object.fromEntries((trends ?? []).map((t) => [t.id, kindOf(t, analyses[t.id]?.category)]));
    return NextResponse.json(kinds);
  } catch (err) {
    return fail(err);
  }
}
