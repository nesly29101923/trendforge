import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/fal";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Field 'file' is required" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
    return NextResponse.json({ url: await uploadFile(file) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
