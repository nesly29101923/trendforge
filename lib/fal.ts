import { fal } from "@fal-ai/client";
import type { VideoJob } from "./types";

export type Quality = "fast" | "hero";

export const MODELS = {
  textToVideo: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
  imageToVideo: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  hero: "fal-ai/veo3.1/fast",
} as const;

export const DURATION_SEC: Record<Quality, number> = { fast: 10, hero: 8 };

const NEGATIVE = "blur, distortion, low quality, watermark, text, logo, deformed hands";

let configured = false;
function client() {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not set");
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
  return fal;
}

interface JobToken {
  m: string;
  r: string;
  t: string;
}

const encode = (t: JobToken) => Buffer.from(JSON.stringify(t)).toString("base64url");
const decode = (id: string): JobToken => JSON.parse(Buffer.from(id, "base64url").toString("utf8"));

function pickModel(quality: Quality, imageUrl?: string): string {
  if (quality === "hero") return MODELS.hero;
  return imageUrl ? MODELS.imageToVideo : MODELS.textToVideo;
}

function buildInput(model: string, prompt: string, imageUrl?: string): Record<string, unknown> {
  if (model === MODELS.hero) {
    return { prompt, aspect_ratio: "9:16", duration: "8s", resolution: "720p", generate_audio: true, negative_prompt: NEGATIVE };
  }
  const base = { prompt, duration: "10", negative_prompt: NEGATIVE, cfg_scale: 0.5 };
  return model === MODELS.imageToVideo ? { ...base, image_url: imageUrl } : { ...base, aspect_ratio: "9:16" };
}

export async function startVideo(args: {
  trendId: string;
  prompt: string;
  quality: Quality;
  imageUrl?: string;
}): Promise<{ jobId: string; model: string }> {
  const model = pickModel(args.quality, args.imageUrl);
  const { request_id } = await client().queue.submit(model, { input: buildInput(model, args.prompt, args.imageUrl) });
  return { jobId: encode({ m: model, r: request_id, t: args.trendId }), model };
}

export async function pollVideo(jobId: string): Promise<Omit<VideoJob, "storyboard">> {
  const { m: model, r: requestId, t: trendId } = decode(jobId);
  const base = { jobId, trendId, model };
  try {
    const status = await client().queue.status(model, { requestId });
    if (status.status === "IN_QUEUE") return { ...base, status: "queued" };
    if (status.status === "IN_PROGRESS") return { ...base, status: "running" };
    const result = await client().queue.result(model, { requestId });
    const video = (result.data as { video?: { url?: string } }).video;
    if (!video?.url) return { ...base, status: "error", error: "No video in result" };
    return { ...base, status: "done", videoUrl: video.url };
  } catch (e) {
    return { ...base, status: "error", error: e instanceof Error ? e.message : "Generation failed" };
  }
}

export const uploadFile = (file: File) => client().storage.upload(file);
