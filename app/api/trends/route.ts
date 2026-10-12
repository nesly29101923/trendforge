import { NextResponse } from "next/server";
import { readDataOrSeed } from "@/lib/store";
import type { Trend } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const trends = (await readDataOrSeed<Trend[]>("trends")) ?? [];
  return NextResponse.json(trends);
}
