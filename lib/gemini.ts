import {
  createPartFromBase64,
  createPartFromUri,
  FileState,
  GoogleGenAI,
  type Part,
} from "@google/genai";
import type { Trend } from "./types";

// Gemini 2.5 is closed to new API keys, so the default is the rolling Flash alias.
// Override with GEMINI_MODEL (e.g. "gemini-3.1-pro-preview" for the hero trend).
const MODELS = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-3-flash-preview"].filter(
  (m, i, all): m is string => !!m && all.indexOf(m) === i,
);

const INLINE_LIMIT = 14 * 1024 * 1024; // keeps the base64 request under Gemini's 20 MB inline cap
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
};

let client: GoogleGenAI | null = null;

function ai() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const isRetryable = (err: unknown) =>
  /\b(404|429|500|503)\b|not found|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded/i.test(String(err));

export async function generateJson<T>(parts: Part[], schema: object): Promise<T> {
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const res = await ai().models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.7 },
      });
      if (!res.text) throw new Error(`Empty response from ${model}`);
      return JSON.parse(res.text) as T;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function download(url: string, maxBytes: number) {
  const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new Error("File too large");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > maxBytes) throw new Error("File too large");
  return { buf, mimeType: res.headers.get("content-type")?.split(";")[0] || "application/octet-stream" };
}

async function videoPart(url: string): Promise<Part> {
  const { buf, mimeType } = await download(url, MAX_VIDEO_BYTES);
  const mime = mimeType.startsWith("video/") ? mimeType : "video/mp4";
  if (buf.byteLength <= INLINE_LIMIT) return createPartFromBase64(buf.toString("base64"), mime);

  let file = await ai().files.upload({
    file: new Blob([new Uint8Array(buf)], { type: mime }),
    config: { mimeType: mime },
  });
  const deadline = Date.now() + 40_000;
  while (file.state === FileState.PROCESSING && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2_000));
    file = await ai().files.get({ name: file.name! });
  }
  if (file.state !== FileState.ACTIVE || !file.uri) throw new Error(`Gemini file not ready (${file.state})`);
  return createPartFromUri(file.uri, file.mimeType ?? mime);
}

async function imagePart(url: string): Promise<Part> {
  const { buf, mimeType } = await download(url, 8 * 1024 * 1024);
  return createPartFromBase64(buf.toString("base64"), mimeType.startsWith("image/") ? mimeType : "image/jpeg");
}

/** Media for the 1–2 top sample videos: real video when downloadable, otherwise cover images. */
export async function trendMedia(trend: Trend): Promise<{ parts: Part[]; kind: "video" | "image" | "none" }> {
  const samples = trend.sampleVideos.slice(0, 2);

  const videos = await Promise.allSettled(
    samples.filter((v) => v.videoUrl).map((v) => videoPart(v.videoUrl!)),
  );
  const videoParts = videos.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (videoParts.length > 0) return { parts: videoParts, kind: "video" };

  const covers = await Promise.allSettled(
    samples.filter((v) => v.coverUrl).map((v) => imagePart(v.coverUrl!)),
  );
  const imageParts = covers.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (imageParts.length > 0) return { parts: imageParts, kind: "image" };

  return { parts: [], kind: "none" };
}
