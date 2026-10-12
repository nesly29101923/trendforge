import { NextResponse } from "next/server";
import { readDataOrSeed } from "@/lib/store";
import type { Trend } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trends = (await readDataOrSeed<Trend[]>("trends")) ?? [];
  const trend = trends.find((t) => t.id === id);
  if (!trend) return NextResponse.json({ error: "Trend not found" }, { status: 404 });
  return NextResponse.json(trend);
}
