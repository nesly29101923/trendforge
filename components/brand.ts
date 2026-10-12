"use client";

import { useEffect, useState } from "react";
import type { BrandBrief } from "@/lib/types";

const KEY = "trendforge:brief";

export function readBrand(): BrandBrief | null {
  try {
    const raw = localStorage.getItem(KEY);
    const brand = raw ? (JSON.parse(raw) as BrandBrief) : null;
    return brand?.brandName && brand.product ? brand : null;
  } catch {
    return null;
  }
}

export function saveBrand(brand: BrandBrief) {
  try {
    localStorage.setItem(KEY, JSON.stringify(brand));
  } catch {}
}

/** The advertiser's brand, persisted across visits. `undefined` while loading on the client. */
export function useBrand() {
  const [brand, setBrand] = useState<BrandBrief | null | undefined>(undefined);
  useEffect(() => setBrand(readBrand()), []);
  return {
    brand,
    setBrand: (b: BrandBrief) => {
      saveBrand(b);
      setBrand(b);
    },
  };
}
