"use client";

import Link from "next/link";
import { useState } from "react";
import type { PostingWindow } from "./format";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" ? "h-12 px-5 text-[15px]" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-ink text-white hover:bg-black",
        variant === "secondary" && "border border-line-strong bg-surface text-ink hover:border-ink/40",
        variant === "ghost" && "text-ink-2 hover:bg-black/5 hover:text-ink",
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
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

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-md", className)} />;
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-2xl border border-line bg-surface", className)}>{children}</section>;
}

export function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted">
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </h3>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-urgent/25 bg-urgent-soft px-4 py-3 text-sm text-ink">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold text-urgent hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

/** Seven-day strip with the posting window highlighted: the core "when to post" signal. */
export function WindowStrip({ window: w, compact = false }: { window: PostingWindow; compact?: boolean }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86_400_000);
    return { i, label: i === 0 ? "Today" : d.toLocaleDateString("en", { weekday: "narrow" }) };
  });
  const tone = !w.open ? "text-muted" : w.urgent ? "text-urgent" : "text-good";
  const fill = w.urgent ? "bg-urgent" : "bg-good";

  return (
    <div>
      <div className={cx("font-semibold", compact ? "text-sm" : "text-base", tone)}>{w.label}</div>
      <div className={cx("mt-1.5 flex gap-1", compact ? "w-36" : "w-full max-w-xs")} aria-hidden>
        {days.map((d) => (
          <div key={d.i} className="flex-1">
            <div
              className={cx(
                "h-1.5 rounded-full",
                w.open && d.i >= w.startDay && d.i <= w.endDay ? fill : "bg-line",
              )}
            />
            {!compact && <div className="mt-1 text-center text-[11px] text-muted">{d.label}</div>}
          </div>
        ))}
      </div>
      {!compact && <p className="mt-2 text-sm text-ink-2">{w.detail}</p>}
    </div>
  );
}

/** Cover image that degrades to a neutral tile when the CDN link has expired. */
export function Cover({ src, className, children }: { src?: string; className?: string; children?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cx(className?.includes("absolute") ? "" : "relative", "overflow-hidden bg-[#e7e9ee]", className)}>
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {children}
    </div>
  );
}

export function TopBar({ brandName, onEditBrand, right }: { brandName?: string; onEditBrand?: () => void; right?: React.ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <rect width="22" height="22" rx="6" fill="var(--color-ink)" />
            <path d="M5 15.5 9.5 10l3 3L17 6.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          TrendForge
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {right}
          {brandName && (
            <button
              onClick={onEditBrand}
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface pl-1.5 pr-3 text-sm font-medium hover:border-line-strong"
              title="Edit your brand"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-semibold text-white">
                {brandName.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-32 truncate">{brandName}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
