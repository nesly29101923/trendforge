"use client";

import { useEffect, useState } from "react";
import type { CreatorType } from "@/lib/types";

const KEY = "trendforge:who";
const EVENT = "trendforge:who";

function read(): CreatorType | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "creator" || v === "agency" || v === "seller" ? v : null;
  } catch {
    return null;
  }
}

/** Who the user is (influencer / agency / small business), remembered across visits and synced across components. Null until picked. */
export function useWho() {
  const [who, setWhoState] = useState<CreatorType | null>(null);
  useEffect(() => {
    setWhoState(read());
    const sync = () => setWhoState(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return {
    who,
    setWho: (v: CreatorType) => {
      try {
        localStorage.setItem(KEY, v);
      } catch {}
      setWhoState(v);
      window.dispatchEvent(new Event(EVENT));
    },
  };
}
