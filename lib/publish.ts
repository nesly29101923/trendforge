import { cachedAnalysis } from "./analysis";
import type { Part } from "@google/genai";
import { generateJson } from "./gemini";
import { captionInsights, hashtagStats } from "./hashtags";
import { publishPlanSchema } from "./schemas";
import type { BrandBrief, CaptionInsights, HashtagStat, PublishPlan, Trend } from "./types";
import { PROMPT_NOTES } from "./audience";

const fmt = (n: number) => Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const pct = (n: number) => `${Math.round(n * 100)}%`;

export interface PublishInput {
  brief?: Partial<BrandBrief>;
  video?: Part;
  draftCaption?: string;
  draftHashtags?: string;
  concept?: string;
}

function prompt(trend: Trend, stats: HashtagStat[], insights: CaptionInsights, input: PublishInput, analysisSummary?: string) {
  const { brief = {}, draftCaption, draftHashtags, concept, video } = input;
  const draft = draftCaption?.trim() || draftHashtags?.trim();
  const who = brief.brandName ? `Brand: ${brief.brandName}. Product: ${brief.product || "n/a"}. Audience: ${brief.audience || "general"}. Tone: ${brief.tone ?? "fun"}. Goal: ${brief.goal ?? "awareness"}.` : "Creator: not specified (infer the niche from the video).";
  return `You are a social media growth strategist. ${video ? "WATCH THE ATTACHED VIDEO: it is the user's own finished video, made for the trend below. Base every hashtag and caption on what is actually in it (subject, product, setting, mood, on-screen text, audio)." : "A creator is about to post a short vertical video that rides this trend."}
Trend: "${trend.title}" (type ${trend.type}, stage ${trend.stage}, momentum ${trend.momentumScore}/100${trend.soundTitle ? `, sound "${trend.soundTitle}"` : ""}).
${analysisSummary ? `How the trend works: ${analysisSummary}` : ""}
${concept ? `Their video concept: ${concept}` : ""}
${who}${brief.creatorType && PROMPT_NOTES[brief.creatorType] ? `\n${PROMPT_NOTES[brief.creatorType]}` : ""}
Write everything in language "${brief.language ?? "en"}" (keep hashtags in the form people actually search).

REAL DATA scraped today (use it, do not invent stats):
Hashtag performance (tag | videos | median plays | engagement | tier):
${stats.map((s) => `#${s.tag} | ${s.videos} | ${fmt(s.medianPlays)} | ${pct(s.engagementRate)} | ${s.tier}`).join("\n")}
Top-video captions: median ${insights.medianLength} characters (hashtags excluded), median ${insights.medianHashtags} hashtags,
${pct(insights.questionShare)} ask a question, ${pct(insights.emojiShare)} use emoji, ${pct(insights.ctaShare)} have a call to action.
Best posting hours of top videos (UTC): ${insights.bestHours.join(", ") || "unknown"}.
Examples: ${insights.topCaptions.map((c) => `"${c.caption}" (${fmt(c.plays)} plays)`).join(" | ") || "none"}

Produce a posting plan:
${video ? "- contentSummary: one sentence describing what you see in their video.\n" : "- Omit contentSummary.\n"}- hashtagSet: 5–8 tags total, specific to THIS video. Mix roles: 1–2 "trend" (from the data, the trend's own tags), 1–2 "broad" (high reach), 2–3 "niche" (what is in the video / its audience), 1 "brand" if a brand is given. Prefer tags with strong data; never "fyp"-style filler. "why" cites the data.
- captions: 3 variants with different styles (e.g. "Hook question", "POV / story", "Direct CTA"), each matching the top-caption length and patterns, with the hook in the first 5 words. Hashtags NOT included in the text.
- firstComment: a pinned comment that sparks replies. coverText: max 6 words for the video cover.
- platforms: one entry each for TikTok, Instagram Reels and YouTube Shorts with an adapted caption (Shorts also needs a searchable title under 70 chars) and 2–3 platform-specific tips (sound, cover, Trial Reels, collab, keywords…).
- timing: when to post (convert the best UTC hours into a concrete recommendation and say it is UTC) and why, also how many days the trend window has left given its stage.
- firstHour: 4–5 concrete actions for the first 60 minutes after posting. avoid: 3–4 mistakes that would kill reach.
${draft ? `- captionCheck: the brand's own draft is below. Score it 0–100 against the data and list 2–4 fixes.\nDraft caption: "${draftCaption ?? ""}"\nDraft hashtags: "${draftHashtags ?? ""}"` : "- Omit captionCheck."}`;
}

export async function buildPublishPlan(trend: Trend, trends: Trend[], input: PublishInput) {
  const stats = hashtagStats(trends, trend);
  const insights = captionInsights(trends, trend);
  const analysis = await cachedAnalysis(trend.id);
  const parts: Part[] = [...(input.video ? [input.video] : []), { text: prompt(trend, stats, insights, input, analysis?.summary) }];
  const raw = await generateJson<Omit<PublishPlan, "trendId" | "hashtagLine">>(parts, publishPlanSchema);
  const seen = new Set<string>();
  const hashtagSet = raw.hashtagSet
    .map((h) => ({ ...h, tag: h.tag.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "") }))
    .filter((h) => h.tag && !seen.has(h.tag.toLowerCase()) && !!seen.add(h.tag.toLowerCase()))
    .slice(0, 8);
  const plan: PublishPlan = {
    ...raw,
    trendId: trend.id,
    contentSummary: input.video ? raw.contentSummary : undefined,
    hashtagSet,
    hashtagLine: hashtagSet.map((h) => `#${h.tag}`).join(" "),
    captionCheck: input.draftCaption?.trim() || input.draftHashtags?.trim() ? raw.captionCheck : undefined,
  };
  return { plan, stats, insights };
}
