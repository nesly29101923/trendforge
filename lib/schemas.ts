// JSON Schemas for Gemini structured output (responseJsonSchema).
// They mirror lib/types.ts; `trendId` is filled in server-side.

const str = { type: "string" } as const;
const strArr = { type: "array", items: str } as const;
const stage = { type: "string", enum: ["rising", "peaking", "fading"] } as const;

export const trendAnalysisSchema = {
  type: "object",
  properties: {
    summary: str,
    category: {
      type: "string",
      enum: ["dance", "acting", "lipsync", "transition", "product", "pov", "other"],
    },
    hasHumans: { type: "boolean" },
    hook: str,
    structure: {
      type: "array",
      items: {
        type: "object",
        properties: { t: str, beat: str },
        required: ["t", "beat"],
      },
    },
    whyItWorks: strArr,
    audioNotes: str,
    brandFit: {
      type: "object",
      properties: { goodFor: strArr, avoidFor: strArr },
      required: ["goodFor", "avoidFor"],
    },
    prediction: {
      type: "object",
      properties: {
        stage,
        peakEstimate: str,
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reasoning: str,
      },
      required: ["stage", "peakEstimate", "confidence", "reasoning"],
    },
  },
  required: [
    "summary",
    "category",
    "hasHumans",
    "hook",
    "structure",
    "whyItWorks",
    "audioNotes",
    "brandFit",
    "prediction",
  ],
};

export const filmGuideSchema = {
  type: "object",
  properties: {
    concept: str,
    totalDurationSec: { type: "number" },
    soundInstruction: str,
    setup: {
      type: "object",
      properties: {
        location: str,
        lighting: str,
        camera: str,
        wardrobe: str,
        props: strArr,
        people: str,
      },
      required: ["location", "lighting", "camera", "wardrobe", "props", "people"],
    },
    shots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          timecode: str,
          onBeat: str,
          angle: str,
          framing: str,
          cameraMovement: str,
          action: str,
          performanceNotes: str,
          onScreenText: str,
          transition: str,
        },
        required: ["index", "timecode", "angle", "framing", "cameraMovement", "action"],
      },
    },
    danceBreakdown: {
      type: "array",
      items: {
        type: "object",
        properties: { count: str, move: str },
        required: ["count", "move"],
      },
    },
    caption: str,
    hashtags: strArr,
    postingTips: strArr,
  },
  required: [
    "concept",
    "totalDurationSec",
    "soundInstruction",
    "setup",
    "shots",
    "caption",
    "hashtags",
    "postingTips",
  ],
};

export const viralScoreSchema = {
  type: "object",
  properties: {
    score: { type: "integer" },
    scoreAfterFixes: { type: "integer" },
    verdict: str,
    breakdown: {
      type: "array",
      items: {
        type: "object",
        properties: { criterion: str, score: { type: "integer" }, note: str },
        required: ["criterion", "score", "note"],
      },
    },
    fixes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["high", "medium", "low"] },
          timecode: str,
          fix: str,
          impact: str,
        },
        required: ["priority", "fix", "impact"],
      },
    },
  },
  required: ["score", "scoreAfterFixes", "verdict", "breakdown", "fixes"],
} as const;

export const publishPlanSchema = {
  type: "object",
  properties: {
    contentSummary: str,
    hashtagSet: {
      type: "array",
      items: {
        type: "object",
        properties: { tag: str, role: { type: "string", enum: ["trend", "broad", "niche", "brand"] }, why: str },
        required: ["tag", "role", "why"],
      },
    },
    captions: {
      type: "array",
      items: { type: "object", properties: { style: str, text: str, why: str }, required: ["style", "text", "why"] },
    },
    firstComment: str,
    coverText: str,
    platforms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["TikTok", "Instagram Reels", "YouTube Shorts"] },
          title: str,
          caption: str,
          tips: strArr,
        },
        required: ["platform", "caption", "tips"],
      },
    },
    timing: { type: "object", properties: { when: str, why: str }, required: ["when", "why"] },
    firstHour: strArr,
    avoid: strArr,
    captionCheck: {
      type: "object",
      properties: { score: { type: "integer" }, verdict: str, fixes: strArr },
      required: ["score", "verdict", "fixes"],
    },
  },
  required: ["hashtagSet", "captions", "firstComment", "coverText", "platforms", "timing", "firstHour", "avoid"],
} as const;
