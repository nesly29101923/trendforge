import type { BrandBrief, FilmGuide, Trend, VideoJob } from "@/lib/types";

export type TrendRef = Pick<Trend, "id" | "soundTitle"> & { name: string };

/** Everything produced for one brand × trend, kept for the browser session. */
export interface MakeState {
  jobId?: string;
  job?: VideoJob;
  videoError?: string;
  guide?: FilmGuide;
  guideError?: string;
}

export const makeKey = (trendId: string, b: BrandBrief) => `make:${trendId}:${b.brandName}:${b.product}:${b.creatorType ?? ""}`;
