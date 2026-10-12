import { GoogleGenAI, Type } from "@google/genai";
import type { BrandBrief, Trend, TrendAnalysis, VideoJob } from "./types";

export type Storyboard = VideoJob["storyboard"];

const MODEL = "gemini-2.5-flash";

const schema = {
  type: Type.OBJECT,
  properties: {
    shots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          shot: { type: Type.INTEGER },
          prompt: { type: Type.STRING },
          durationSec: { type: Type.NUMBER },
        },
        required: ["shot", "prompt", "durationSec"],
      },
    },
  },
  required: ["shots"],
};

function fallback(trend: Trend, brief: BrandBrief, totalSec: number): Storyboard {
  return [
    {
      shot: 1,
      durationSec: totalSec,
      prompt:
        `Vertical 9:16 short-form social ad for ${brief.brandName} ${brief.product}, ${brief.tone} tone, ` +
        `recreating the "${trend.title}" trend. Strong hook in the first second, dynamic handheld camera, ` +
        `bright natural lighting, product clearly visible, energetic pacing, photorealistic.`,
    },
  ];
}

export async function buildStoryboard(
  trend: Trend,
  brief: BrandBrief,
  analysis: TrendAnalysis | null,
  totalSec: number,
): Promise<Storyboard> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback(trend, brief, totalSec);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You write prompts for an AI video model that makes vertical 9:16 short-form ads.
Trend: "${trend.title}" (type: ${trend.type}; hashtags: ${trend.hashtags.join(", ")}).
${analysis ? `How the trend works: ${analysis.summary} Hook: ${analysis.hook}. Structure: ${analysis.structure.map((s) => `${s.t} ${s.beat}`).join("; ")}.` : ""}
Brand: ${brief.brandName}. Product: ${brief.product}. Audience: ${brief.audience}. Tone: ${brief.tone}. Goal: ${brief.goal}.
Write 1 to 3 consecutive shots totalling exactly ${totalSec} seconds that recreate the trend's format with this product.
Each prompt is one dense paragraph: subject, action, camera angle and movement, lighting, setting, style, "vertical 9:16".
No on-screen text, no logos, no real people's names, no copyrighted music. Return JSON only.`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    const shots = (JSON.parse(res.text ?? "{}").shots ?? []) as Storyboard;
    return shots.length ? shots.slice(0, 3) : fallback(trend, brief, totalSec);
  } catch {
    return fallback(trend, brief, totalSec);
  }
}

export const mergeShots = (shots: Storyboard) =>
  shots.length === 1
    ? shots[0].prompt
    : shots.map((s) => `Shot ${s.shot} (${s.durationSec}s): ${s.prompt}`).join(" Then cut to ");
