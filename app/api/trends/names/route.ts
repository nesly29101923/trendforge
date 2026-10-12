import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { trendNames } from "@/lib/names";
import { readDataOrSeed } from "@/lib/store";
import type { Trend } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const trends = (await readDataOrSeed<Trend[]>("trends")) ?? [];
    return NextResponse.json(trends.length ? await trendNames(trends) : {});
  } catch (err) {
    return fail(err);
  }
}
