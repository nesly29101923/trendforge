import { ApifyClient } from "apify-client";
import type { RawVideo } from "./types";

const TIKTOK_ACTOR = process.env.APIFY_TIKTOK_ACTOR ?? "clockworks/tiktok-scraper";

const DEFAULT_QUERIES = ["trend", "dance challenge", "trending sound", "transition trend", "pov trend"];

type Item = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function normalizeTikTok(item: Item): RawVideo | null {
  const id = String(item.id ?? "");
  if (!id) return null;
  const music = item.musicMeta ?? {};
  const meta = item.videoMeta ?? {};
  const created =
    item.createTimeISO ?? (item.createTime ? new Date(num(item.createTime) * 1000).toISOString() : new Date().toISOString());
  return {
    id,
    platform: "tiktok",
    url: item.webVideoUrl ?? `https://www.tiktok.com/@${item.authorMeta?.name ?? "user"}/video/${id}`,
    videoUrl: Array.isArray(item.mediaUrls) && item.mediaUrls[0] ? item.mediaUrls[0] : undefined,
    coverUrl: meta.originalCoverUrl ?? meta.coverUrl,
    caption: item.text ?? "",
    hashtags: (item.hashtags ?? []).map((h: Item | string) => (typeof h === "string" ? h : h?.name)).filter(Boolean),
    soundId: music.musicId ? String(music.musicId) : undefined,
    soundTitle: music.musicName,
    soundAuthor: music.musicAuthor,
    isOriginalSound: typeof music.musicOriginal === "boolean" ? music.musicOriginal : undefined,
    plays: num(item.playCount),
    likes: num(item.diggCount),
    comments: num(item.commentCount),
    shares: num(item.shareCount),
    createdAt: created,
    durationSec: num(meta.duration) || undefined,
    region: item.locationCreated,
  };
}

export async function scrapeTikTok(queries: string[] = DEFAULT_QUERIES, perQuery = 12): Promise<RawVideo[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set");
  const client = new ApifyClient({ token });
  const run = await client.actor(TIKTOK_ACTOR).call(
    {
      searchQueries: queries,
      resultsPerPage: perQuery,
      searchSection: "/video",
      videoSearchDateFilter: "PAST_WEEK",
      shouldDownloadVideos: true,
      shouldDownloadCovers: true,
    },
    { waitSecs: 240 },
  );
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const seen = new Set<string>();
  return items
    .map((i) => normalizeTikTok(i as Item))
    .filter((v): v is RawVideo => !!v && !seen.has(v.id) && !!seen.add(v.id));
}
