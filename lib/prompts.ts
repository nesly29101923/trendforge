import type { BrandBrief, Trend, TrendAnalysis } from "./types";
import { PROMPT_NOTES } from "./audience";

const compact = (n: number) =>
  Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function trendContext(trend: Trend) {
  const sample = trend.sampleVideos[0];
  return [
    `Trend: "${trend.title}" (type: ${trend.type})`,
    trend.soundTitle && `Sound: "${trend.soundTitle}"${trend.soundAuthor ? ` by ${trend.soundAuthor}` : ""}`,
    trend.hashtags.length > 0 && `Hashtags: ${trend.hashtags.map((h) => `#${h}`).join(" ")}`,
    `Platforms: ${trend.platforms.join(", ")}`,
    `Stats: ${trend.videoCount} videos, ${compact(trend.totalPlays)} total plays, ` +
      `engagement ${(trend.avgEngagementRate * 100).toFixed(1)}%, momentum ${Math.round(trend.momentumScore)}/100, ` +
      `computed stage "${trend.stage}"`,
    sample?.caption && `Top video caption: "${sample.caption}"`,
    sample?.createdAt && `Top video posted: ${sample.createdAt}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function analysisPrompt(trend: Trend, media: "video" | "image" | "none") {
  const source =
    media === "video"
      ? "Watch and listen to the attached video(s) from this trend."
      : media === "image"
        ? "The video file is unavailable; use the attached cover image(s) plus the metadata. Infer carefully and lower your prediction confidence."
        : "No media is available; reason from the metadata only and lower your prediction confidence.";

  return `You are a senior short-form video strategist who helps brands ride trends on TikTok, Reels and Shorts.
${source}

${trendContext(trend)}
Today: ${new Date().toISOString().slice(0, 10)}

Explain exactly how this trend works so a brand could replicate it:
- summary: 1–2 sentences, what the trend is.
- category: dance | acting | lipsync | transition | product | pov | other.
- hasHumans: whether people appear on screen.
- hook: what happens in the first 1–2 seconds that stops the scroll.
- structure: a second-by-second timeline ({t:"0-2s", beat:"..."}), 4–8 entries, covering the whole video.
- whyItWorks: 3–5 specific reasons (psychology, format, audio, participation), not generic advice.
- audioNotes: BPM estimate, where the drop / key beats land in seconds, how visuals sync to audio.
- brandFit.goodFor: 3–5 brand categories that fit naturally; brandFit.avoidFor: 2–3 that would feel forced.
- prediction: lifecycle stage (rising/peaking/fading), peakEstimate (e.g. "next 3–5 days" or "peaked ~2 days ago"),
  confidence 0–1, and reasoning grounded in the stats above (recency, velocity, saturation) and the format's replicability.

Be concrete and specific to THIS trend. Return JSON only, matching the schema.`;
}

const categoryInstructions: Record<TrendAnalysis["category"], string> = {
  dance: `DANCE TREND:
- Fill danceBreakdown with 8-counts aligned to the beat from the audio notes (e.g. count "1-8 (0.0–3.7s)").
- Moves must be simple enough for a non-dancer employee to learn in 15 minutes; describe each move plainly.
- Put each move description in the shot's performanceNotes too. Show where the product appears (held, worn, revealed on the drop).
- Camera: 60 fps, static tripod, full body framing unless the trend uses hand choreo.`,
  acting: `ACTING TREND:
- performanceNotes per shot: emotion, facial expression, line delivery, pauses, eye-line (lens or off-camera).
- Write the exact lines/on-screen text adapted to the brand. Keep the comedic or emotional timing of the original.`,
  lipsync: `LIPSYNC TREND:
- performanceNotes per shot: which lyric/line is being mouthed, expression, gestures that land on key words.
- Tell the performer to rehearse with the sound playing in-app and to exaggerate mouth shapes slightly.`,
  pov: `POV TREND:
- performanceNotes per shot: who the viewer is in the POV, the performer's reaction, eye-line straight to lens.
- onScreenText carries the "POV: ..." setup line adapted to the brand.`,
  transition: `TRANSITION TREND (product/object focused, humans optional):
- Product-only shot list is fine: surface, background, hand-model actions.
- For each cut, explain the transition technique precisely (match cut, hand-cover wipe, whip pan, jump on beat) and how to line up the two shots.`,
  product: `PRODUCT / NO-HUMAN TREND:
- Shot list of the product: surface, background colour, hand-model actions, macro details, reveal moment on the beat.
- No on-camera talent required; mention if hands appear.`,
  other: `Adapt the format faithfully; add performanceNotes wherever a person performs.`,
};

export function guidePrompt(trend: Trend, analysis: TrendAnalysis, brief: BrandBrief) {
  const lang = brief.language && brief.language !== "en" ? brief.language : "English";

  return `You are a short-form video director. Turn this trend into a ready-to-film ad for the brand below.

${trendContext(trend)}

TREND ANALYSIS
${JSON.stringify(
  {
    summary: analysis.summary,
    category: analysis.category,
    hasHumans: analysis.hasHumans,
    hook: analysis.hook,
    structure: analysis.structure,
    whyItWorks: analysis.whyItWorks,
    audioNotes: analysis.audioNotes,
  },
  null,
  2,
)}

BRAND BRIEF
- Brand: ${brief.brandName}
- Product: ${brief.product}
- Audience: ${brief.audience}
- Tone: ${brief.tone}
- Goal: ${brief.goal}${brief.creatorType && PROMPT_NOTES[brief.creatorType] ? `\n${PROMPT_NOTES[brief.creatorType]}` : ""}
${brief.productImageUrl ? "- The brand has a product photo; the product's look matters, feature it clearly.\n" : ""}
${categoryInstructions[analysis.category]}

ALWAYS:
- Keep the trend's recognizable structure and timing; the brand twist must feel native, not like an ad.
- The hook happens in the first 1.5 s (shot 1). The product or brand appears naturally, never as a hard sell.
- Timecodes are continuous from 0.0s to totalDurationSec, synced to the beats in the audio notes; set onBeat where a cut or move lands on a beat.
- setup.camera: smartphone, vertical 9:16, 1080×1920, ${analysis.category === "dance" ? "60" : "30"} fps, stabilization advice.
- setup.lighting: a concrete key/fill setup (window light or ring light), achievable with no crew.
- soundInstruction: tell them to add the trending sound${trend.soundTitle ? ` "${trend.soundTitle}"` : ""} INSIDE the TikTok/Instagram app when posting (licensed in-platform), and from which second to start it. Never suggest downloading or ripping the audio.
- 4–10 shots. Concrete actions, angles (eye-level / low / high / top-down / POV), framing (wide / medium / close-up / ECU), camera movement.
- caption: platform-native, matches the ${brief.tone} tone and the ${brief.goal} goal. hashtags: 4–8 without the # sign, mixing the trend's tags and brand/niche tags.
- postingTips: 3–5 tips (best posting time, first-hour engagement, reply strategy, cross-posting).
- Write every text field in ${lang}.
${analysis.category === "dance" ? "" : "- Omit danceBreakdown.\n"}
Return JSON only, matching the schema.`;
}
