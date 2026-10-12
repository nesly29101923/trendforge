"use client";

import { useEffect, useState } from "react";
import type { TrendNames } from "@/lib/names";
import type { Trend } from "@/lib/types";
import { getJSON, session } from "./api";

const KEY = "trendforge:names";

/** Readable trend names; refetched whenever `source` (the loaded trend or trend list) changes. */
export function useTrendNames(source: Trend | Trend[] | null) {
  const [names, setNames] = useState<TrendNames>({});
  useEffect(() => {
    if (!source) return;
    const cached = session.get<TrendNames>(KEY);
    if (cached) setNames(cached);
    getJSON<TrendNames>("/api/trends/names")
      .then((n) => {
        session.set(KEY, n);
        setNames(n);
      })
      .catch(() => {});
  }, [source]);
  return names;
}

export const displayName = (t: Trend, names: TrendNames) =>
  names[t.id]?.name ?? t.title.replace(/^#/, "").replace(/\s·\s.*$/, "");
