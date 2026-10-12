"use client";

import { useEffect, useRef, useState } from "react";
import type { BrandBrief } from "@/lib/types";
import { uploadFile } from "./api";
import { Button, Spinner, cx } from "./ui";

const TONES: BrandBrief["tone"][] = ["fun", "premium", "edgy", "wholesome", "informative"];

const field =
  "h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-[15px] outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent-soft";

/** Brand details, asked once at the moment they're needed and remembered afterwards. */
export function BrandSheet({
  initial,
  title,
  submitLabel,
  onSave,
  onClose,
}: {
  initial: BrandBrief | null;
  title: string;
  submitLabel: string;
  onSave: (b: BrandBrief) => void;
  onClose: () => void;
}) {
  const [b, setB] = useState<BrandBrief>(initial ?? { brandName: "", product: "", audience: "", tone: "fun", goal: "awareness", language: "en" });
  const [photo, setPhoto] = useState<{ preview: string; state: "uploading" | "done" | "error" } | null>(
    initial?.productImageUrl ? { preview: initial.productImageUrl, state: "done" } : null,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof BrandBrief>(k: K, v: BrandBrief[K]) => setB((x) => ({ ...x, [k]: v }));
  const ready = b.brandName.trim() && b.product.trim() && photo?.state !== "uploading";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onFile(file?: File) {
    if (!file) return;
    setPhoto({ preview: URL.createObjectURL(file), state: "uploading" });
    try {
      const { url } = await uploadFile("/api/create/video/upload", file);
      set("productImageUrl", url);
      setPhoto((p) => p && { ...p, state: "done" });
    } catch {
      setPhoto((p) => p && { ...p, state: "error" });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onSave({ ...b, brandName: b.brandName.trim(), product: b.product.trim(), audience: b.audience.trim() });
        }}
        className="w-full max-w-md rounded-t-2xl bg-surface p-6 sm:rounded-2xl"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-2">Asked once. We&apos;ll remember it for every trend.</p>

        <div className="mt-5 space-y-3">
          <input className={field} placeholder="Brand name" aria-label="Brand name" autoFocus value={b.brandName} onChange={(e) => set("brandName", e.target.value)} />
          <input className={field} placeholder="What you're promoting, e.g. sparkling energy drink" aria-label="Product" value={b.product} onChange={(e) => set("product", e.target.value)} />
          <input className={field} placeholder="Who it's for (optional)" aria-label="Audience" value={b.audience} onChange={(e) => set("audience", e.target.value)} />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tone">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={b.tone === t}
              onClick={() => set("tone", t)}
              className={cx(
                "rounded-full border px-3 py-1 text-sm capitalize",
                b.tone === t ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-line-strong",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="mt-4 flex items-center gap-3 text-sm text-ink-2 hover:text-ink">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-dashed border-line-strong text-lg">+</span>
          )}
          {photo?.state === "uploading" ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-3 w-3" /> Uploading photo
            </span>
          ) : photo?.state === "error" ? (
            <span className="text-urgent">Upload failed. Try another photo</span>
          ) : photo ? (
            "Product photo added. Change"
          ) : (
            "Add a product photo (optional, makes the AI video show your product)"
          )}
        </button>

        <div className="mt-6 flex gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={!ready}>
            {submitLabel}
          </Button>
          <Button type="button" size="lg" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
