"use client";

import { CONTENT_KINDS, CREATOR_TYPES } from "@/lib/audience";
import type { ContentKind, CreatorType } from "@/lib/types";
import { cx } from "./ui";

export type KindFilter = "foryou" | "all" | ContentKind;

/** "I'm a…" segmented control. One tap, no onboarding. */
export function WhoPicker({ who, onChange, className }: { who: CreatorType | null; onChange: (v: CreatorType) => void; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-ink-2">I&apos;m</span>
      <div role="radiogroup" aria-label="I'm a" className="inline-flex rounded-full border border-line-strong bg-surface p-0.5">
        {CREATOR_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={who === t.id}
            title={t.hint}
            onClick={() => onChange(t.id)}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              who === t.id ? "bg-ink text-white" : "text-ink-2 hover:text-ink",
            )}
          >
            {t.id === "creator" ? "an influencer" : t.id === "agency" ? "an ad agency" : "a small business"}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Content-type chips: For you (when a type is picked), All, then each kind that has trends today. */
export function KindChips({
  value,
  onChange,
  counts,
  showForYou,
}: {
  value: KindFilter;
  onChange: (v: KindFilter) => void;
  counts: Partial<Record<KindFilter, number>>;
  showForYou: boolean;
}) {
  const chips: { id: KindFilter; label: string }[] = [
    ...(showForYou ? [{ id: "foryou" as const, label: "For you" }] : []),
    { id: "all", label: "All" },
    ...CONTENT_KINDS.filter((k) => counts[k.id]),
  ];
  return (
    <div role="tablist" aria-label="Content type" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          role="tab"
          aria-selected={value === c.id}
          onClick={() => onChange(c.id)}
          className={cx(
            "shrink-0 rounded-full border px-3 py-1 text-sm",
            value === c.id ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-line-strong",
          )}
        >
          {c.label}
          {counts[c.id] !== undefined && <span className={cx("ml-1.5 tabular-nums", value === c.id ? "text-white/70" : "text-muted")}>{counts[c.id]}</span>}
        </button>
      ))}
    </div>
  );
}
