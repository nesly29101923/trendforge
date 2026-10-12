import Link from "next/link";
import type { Trend } from "@/lib/types";
import { compact, isEarlySignalTrend } from "./format";
import { EarlySignalBadge, MomentumBar, PlatformTags, StageBadge } from "./ui";

const typeLabel: Record<Trend["type"], string> = {
  sound: "Original sound",
  music: "Music track",
  format: "Format",
};

export function TrendCard({ trend, rank }: { trend: Trend; rank: number }) {
  const cover = trend.sampleVideos.find((v) => v.coverUrl)?.coverUrl;

  return (
    <Link
      href={`/trend/${encodeURIComponent(trend.id)}`}
      className="group flex gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-white/20 hover:bg-surface-2 sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden"
    >
      <div className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:aspect-[4/5] sm:w-full sm:rounded-none">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="brand-gradient h-full w-full opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-bold tabular-nums backdrop-blur">
          #{rank}
        </span>
        <span className="absolute bottom-2 left-2 hidden text-xs font-semibold sm:block">▶ {compact(trend.totalPlays)}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <StageBadge stage={trend.stage} />
          {isEarlySignalTrend(trend) && <EarlySignalBadge />}
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug">{trend.title}</h3>
        {trend.soundTitle && (
          <p className="truncate text-sm text-muted">
            ♫ {trend.soundTitle}
            {trend.soundAuthor && ` · ${trend.soundAuthor}`}
          </p>
        )}
        <div className="mt-auto space-y-2">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Momentum</div>
            <MomentumBar score={trend.momentumScore} />
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>
              {typeLabel[trend.type]} · {trend.videoCount} videos
              <span className="sm:hidden"> · {compact(trend.totalPlays)} plays</span>
            </span>
            <PlatformTags platforms={trend.platforms} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TrendCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-col sm:p-0 sm:overflow-hidden">
      <div className="skeleton aspect-[9/16] w-24 shrink-0 rounded-xl sm:aspect-[4/5] sm:w-full sm:rounded-none" />
      <div className="flex flex-1 flex-col gap-2 sm:p-4">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-4 w-3/5 rounded" />
        <div className="skeleton mt-auto h-2 w-full rounded" />
      </div>
    </div>
  );
}
