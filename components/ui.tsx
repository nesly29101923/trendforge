import type { Platform, TrendStage } from "@/lib/types";
import { platformLabel } from "./format";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const stageStyle: Record<TrendStage, { label: string; className: string; icon: string }> = {
  rising: { label: "Rising", className: "bg-cyan/15 text-cyan ring-cyan/30", icon: "↗" },
  peaking: { label: "Peaking", className: "bg-pink/15 text-pink ring-pink/30", icon: "▲" },
  fading: { label: "Fading", className: "bg-white/5 text-muted ring-white/10", icon: "↘" },
};

export function StageBadge({ stage }: { stage: TrendStage }) {
  const s = stageStyle[stage];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1", s.className)}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

export function EarlySignalBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-xs font-semibold text-amber ring-1 ring-amber/40">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber" />
      </span>
      Early Signal
    </span>
  );
}

export function MomentumBar({ score, large = false }: { score: number; large?: boolean }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="flex items-center gap-2">
      <div className={cx("flex-1 overflow-hidden rounded-full bg-white/5", large ? "h-2.5" : "h-1.5")}>
        <div className="brand-gradient h-full rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className={cx("tabular-nums font-semibold", large ? "text-base" : "text-xs")}>{value}</span>
    </div>
  );
}

export function PlatformTags({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="flex gap-1">
      {platforms.map((p) => (
        <span key={p} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {platformLabel[p]}
        </span>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-lg", className)} />;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-surface p-4 sm:p-5", className)}>{children}</div>;
}

export function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
      {icon && <span aria-hidden className="text-sm">{icon}</span>}
      {children}
    </h3>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink/30 bg-pink/10 px-4 py-3 text-sm">
      <span className="text-pink">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-white/10 px-3 py-1.5 font-medium hover:bg-white/15">
          Retry
        </button>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
        active ? "bg-fg text-bg" : "bg-surface-2 text-muted ring-1 ring-line hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
