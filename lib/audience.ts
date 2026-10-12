import type { ContentKind, CreatorType, Trend } from "./types";

export const CREATOR_TYPES: { id: CreatorType; label: string; hint: string }[] = [
  { id: "creator", label: "Influencer", hint: "You post on your own account" },
  { id: "agency", label: "Ad agency", hint: "You make ads for clients" },
  { id: "seller", label: "Small business", hint: "You sell your own products" },
];

export const CONTENT_KINDS: { id: ContentKind; label: string }[] = [
  { id: "dance", label: "Dance" },
  { id: "acting", label: "Skit" },
  { id: "lipsync", label: "Lip-sync" },
  { id: "pov", label: "POV" },
  { id: "transition", label: "Transition" },
  { id: "product", label: "Product" },
];

/** Content kinds each type sees first ("For you"). */
export const KINDS_FOR: Record<CreatorType, ContentKind[]> = {
  creator: ["dance", "lipsync", "pov", "acting"],
  agency: ["product", "transition", "pov", "acting", "dance"],
  seller: ["product", "transition", "pov"],
};

/** Copy that changes with the type, used by the brand sheet. */
export const BRIEF_COPY: Record<CreatorType, { title: string; name: string; product: string; audience: string }> = {
  creator: { title: "Tell us about your account", name: "Your handle, e.g. @maya.moves", product: "What you're promoting, or your niche", audience: "Your followers (optional)" },
  agency: { title: "Which client is this for?", name: "Client brand", product: "Client's product, e.g. sparkling energy drink", audience: "Client's target audience (optional)" },
  seller: { title: "Tell us about your shop", name: "Shop or brand name", product: "What you sell, e.g. handmade soy candles", audience: "Your buyers (optional)" },
};

/** Extra direction for every LLM prompt, per type. */
export const PROMPT_NOTES: Record<CreatorType, string> = {
  creator:
    "WHO IS MAKING IT: an influencer posting on their own account. They are the on-camera talent. Keep their personality front and centre; the product is a natural cameo (sponsored/affiliate feel), and the caption sounds like the creator, not a brand.",
  agency:
    "WHO IS MAKING IT: an ad agency producing for a client. Output must be client-ready: clear brand moment, logo/packshot in the last shot, talent and props specified so a small crew can shoot it.",
  seller:
    "WHO IS MAKING IT: a small business owner marketing their own products, solo, with only a phone. No actors or dancers needed unless the trend requires it; the product is the hero. Keep it cheap, quick to shoot, and end with a clear way to buy.",
};

const KEYWORDS: [ContentKind, RegExp][] = [
  ["dance", /dance|choreo|danc/i],
  ["lipsync", /lip ?sync|lipsing/i],
  ["transition", /transition|glow ?up|before.?after/i],
  ["product", /product|unbox|review|tiktokmademebuyit|haul|asmr|packing/i],
  ["acting", /skit|comedy|acting|storytime/i],
  ["pov", /\bpov\b|relatable/i],
];

/** Analysis category when we have it, otherwise a keyword guess from the trend's title and hashtags. */
export function kindOf(trend: Trend, analyzed?: ContentKind): ContentKind {
  if (analyzed && analyzed !== "other") return analyzed;
  const text = [trend.title, ...trend.hashtags].join(" ");
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? "other";
}
