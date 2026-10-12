export type Platform = "tiktok" | "instagram" | "youtube";
export type TrendType = "sound" | "music" | "format";
export type TrendStage = "rising" | "peaking" | "fading";

export interface RawVideo {
  id: string;
  platform: Platform;
  url: string;              // public post URL
  videoUrl?: string;        // direct mp4 if the scraper provides it (needed for Gemini)
  coverUrl?: string;
  caption: string;
  hashtags: string[];
  soundId?: string;
  soundTitle?: string;
  soundAuthor?: string;
  isOriginalSound?: boolean;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;        // ISO
  durationSec?: number;
  region?: string;
}

export interface Trend {
  id: string;               // slug
  type: TrendType;
  title: string;            // e.g. "‘Espresso’ hand-choreo" or "Before/after reveal transition"
  soundTitle?: string;
  soundAuthor?: string;
  hashtags: string[];
  platforms: Platform[];
  videoCount: number;
  totalPlays: number;
  avgEngagementRate: number;    // (likes+comments+shares)/plays
  momentumScore: number;        // 0–100, see §6.3
  stage: TrendStage;
  sampleVideos: RawVideo[];     // top 3–5
  updatedAt: string;
}

export interface TrendAnalysis {
  trendId: string;
  summary: string;              // 1–2 sentences
  category: "dance" | "acting" | "lipsync" | "transition" | "product" | "pov" | "other";
  hasHumans: boolean;
  hook: string;                 // what happens in the first 1–2 s
  structure: { t: string; beat: string }[];   // timeline, e.g. {t:"0-2s", beat:"..."}
  whyItWorks: string[];
  audioNotes: string;           // tempo/BPM estimate, drops, where the beat hits
  brandFit: { goodFor: string[]; avoidFor: string[] };
  prediction: {
    stage: TrendStage;
    peakEstimate: string;       // e.g. "next 3–5 days"
    confidence: number;         // 0–1
    reasoning: string;
  };
}

export interface BrandBrief {
  brandName: string;
  product: string;
  audience: string;
  tone: "fun" | "premium" | "edgy" | "wholesome" | "informative";
  goal: "awareness" | "engagement" | "sales";
  productImageUrl?: string;     // uploaded to fal storage
  language?: string;            // default "en"
}

export interface FilmGuide {           // Option A
  trendId: string;
  concept: string;
  totalDurationSec: number;
  soundInstruction: string;            // "Use sound X from the TikTok library, start at 0:12"
  setup: {
    location: string;
    lighting: string;
    camera: string;                    // device, orientation 9:16, fps, stabilization
    wardrobe: string;
    props: string[];
    people: string;                    // how many, roles
  };
  shots: {
    index: number;
    timecode: string;                  // "0.0–1.5s"
    onBeat?: string;                   // "lands on beat 1 of the drop"
    angle: string;                     // eye-level / low / high / top-down / POV
    framing: string;                   // wide / medium / close-up / ECU
    cameraMovement: string;            // static / push-in / whip pan / handheld
    action: string;                    // what the performer/product does
    performanceNotes?: string;         // acting: emotion/expression; dance: move description
    onScreenText?: string;
    transition?: string;
  }[];
  danceBreakdown?: { count: string; move: string }[];   // only for dance trends
  caption: string;
  hashtags: string[];
  postingTips: string[];
}

export interface VideoJob {             // Option B
  jobId: string;                        // fal request_id
  trendId: string;
  status: "queued" | "running" | "done" | "error";
  storyboard: { shot: number; prompt: string; durationSec: number }[];
  model: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface ViralScore {
  trendId: string;
  score: number;                         // 0–100, the draft as uploaded
  scoreAfterFixes: number;               // 0–100, if every fix is applied
  verdict: string;                       // one sentence
  breakdown: { criterion: string; score: number; note: string }[];   // each 0–10
  fixes: { priority: "high" | "medium" | "low"; timecode?: string; fix: string; impact: string }[];
  expectedViews: { before: { low: number; high: number }; after: { low: number; high: number } };
}

export interface HashtagStat {
  tag: string;
  videos: number;               // scraped videos using it
  trends: number;               // trends it appears in
  medianPlays: number;
  engagementRate: number;       // (likes+comments+shares)/plays across its videos
  score: number;                // 0–100 relative strength
  tier: "broad" | "trend" | "niche";
}

export interface CaptionInsights {
  sampleSize: number;
  medianLength: number;         // characters, hashtags excluded
  medianHashtags: number;
  questionShare: number;        // share of top captions that ask a question (0–1)
  emojiShare: number;
  ctaShare: number;             // share with a call to action ("comment", "follow", "link", "save"…)
  bestHours: number[];          // UTC hours (0–23) when the best-performing videos were posted
  topCaptions: { caption: string; plays: number }[];
}

export interface PublishPlan {
  trendId: string;
  contentSummary?: string;      // what the AI saw in the uploaded video
  hashtagLine: string;          // ready-to-paste: "#a #b #c"
  hashtagSet: { tag: string; role: "trend" | "broad" | "niche" | "brand"; why: string }[];
  captions: { style: string; text: string; why: string }[];
  firstComment: string;
  coverText: string;
  platforms: { platform: "TikTok" | "Instagram Reels" | "YouTube Shorts"; title?: string; caption: string; tips: string[] }[];
  timing: { when: string; why: string };
  firstHour: string[];          // engagement actions in the first 60 minutes
  avoid: string[];
  captionCheck?: { score: number; verdict: string; fixes: string[] };   // only when the user pasted their own caption
}
