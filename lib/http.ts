import { NextResponse } from "next/server";

export const fail = (error: unknown, status = 500) =>
  NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status });

export async function readBody<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
