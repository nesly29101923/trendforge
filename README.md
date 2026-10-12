# TrendForge — AI Short-Video Trend Engine for Advertisers

> Working name. Hackathon build at Slush (Manus event). **Time budget: 4 hours. Team: 2 developers.**
> **Status 12 Oct, 12:30:** WS0–WS5 merged on `main` (Dev 2 + Claude as Dev 1; Manus dropped for speed). Viral Score added (§14). API contract in §13.
> This README is the single source of truth for every AI agent working in parallel. Read §0–§4 before writing any code. Do not change the shared contracts in §4 without telling the team.

---

## 0. One-line pitch

**TrendForge watches TikTok, Reels and Shorts every day, explains *why* each trend works, predicts which ones are about to blow up, and turns any trend into a ready-to-post ad: either a shot-by-shot filming guide for a human, or a fully AI-generated video made with fal.ai.**

Target user: **advertisers / brand marketers** who need to ride a trend within hours, not weeks.

---

## 1. What we are building (scope for the demo)

### 1.1 Core flow (this is the demo — protect it at all costs)

```
[Trend Radar]  →  [Trend Detail + Why It Works]  →  [Brand Brief form]  →  choose:
                                                                         ├─ Option A: "Film It Yourself" → Shot-by-shot production guide
                                                                         └─ Option B: "Generate with AI" → fal.ai video (9:16)
```

### 1.2 Features

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| F1 | **Daily trend ingestion** from TikTok (+ Instagram Reels, YouTube Shorts if time) via Apify | P0 | Live call + cached `seed/trends.json` fallback. The demo must never depend on a live scrape succeeding. |
| F2 | **Trend clustering** — group videos into trends by: trending sound, hashtag, format/template | P0 | 3 trend types: `sound`, `music`, `format` (format = visual template, may have no humans/no dance). |
| F3 | **Trend analysis** — Gemini watches the reference video(s) and explains: hook, structure, timing, why it's viral, what kind of brands it fits | P0 | Gemini accepts video + audio natively. |
| F4 | **Momentum score + "Rising / Peaking / Fading" label + future prediction** | P0 | Simple math (see §6.3) + Gemini reasoning. This is our "predict future trends" story. |
| F5 | **Option A — Film It Yourself guide**: scenes, timestamps synced to the beat, camera angle, framing, lighting, movement, wardrobe, props, on-screen text, caption, hashtags, sound to use. For dance trends: beat-by-beat move breakdown. For acting trends: line-by-line performance notes. For non-human trends: object/product shot list. | P0 | |
| F6 | **Option B — AI video via fal.ai**: brand brief + trend → storyboard prompt(s) → fal video model → 9:16 MP4 | P0 | |
| F7 | Brand brief form: brand name, product, audience, tone, goal (awareness/sales), optional product image upload | P0 | Product image enables fal image-to-video. |
| F8 | Multi-platform view (Reels, Shorts) + global music charts | P1 | Only after P0 works end-to-end. |
| F10 | **Dance Coach** for dance trends (reuses Dance AI, §12): accurate beat grid + an animated "shadow coach" the user learns from, and optional webcam scoring | P1 | Strongest demo moment after P0 works. |
| F9 | "Daily refresh" cron | P2 | For the pitch, a "Refresh trends" button is enough. Say "runs daily" in the pitch. |

### 1.3 Explicit non-goals (do NOT build)

- User accounts / auth / payments
- Posting to TikTok/Instagram
- New pose-estimation / choreography code. We already have it: reuse Dance AI (§12) instead of writing it again.
- Native mobile app (it's a responsive web app; open it on the phone browser for the mobile demo)

---

## 2. Tech stack (decided — do not substitute)

| Layer | Choice | Why |
|-------|--------|-----|
| App | **Next.js 14+ (App Router) + TypeScript** | One codebase, frontend + API routes, works on Windows and Mac |
| UI | **Tailwind CSS + shadcn/ui** | Fast, good-looking |
| Analysis / LLM | **Google Gemini API** — `gemini-2.5-flash` (fast) / `gemini-2.5-pro` (deep analysis) via `@google/genai` | Understands video + audio directly. Free key at https://aistudio.google.com/apikey |
| LLM fallback | **fal `openrouter/router/vision`** or `fal-ai/any-llm` (paid with fal credits) | If the Gemini key hits rate limits |
| Scraping | **Apify** via `apify-client` | TikTok/Reels/Shorts data |
| Generation | **fal.ai** via `@fal-ai/client` | Video, image, audio, voiceover |
| Storage | JSON files in `/data` + in-memory cache (no database) | Zero setup. Optional: Vercel KV if deployed |
| Deploy | **Vercel** (free) | Phone demo via the public URL |

> ⚠️ **API keys:** a Claude Pro / Gemini Pro *chat subscription* does NOT include API access. Get a **Gemini API key from Google AI Studio** (free tier). The Anthropic API is not required.

### 2.1 Environment variables (`.env.local`, never commit)

```
GEMINI_API_KEY=
APIFY_TOKEN=
FAL_KEY=
USE_SEED_DATA=false        # true = skip Apify, read /seed/*.json (demo safety switch)
```

All keys are used **server-side only** (API routes). Never expose them to the browser.

---

## 3. Repository structure

```
trendforge/
├─ app/
│  ├─ page.tsx                      # Trend Radar (dashboard)
│  ├─ trend/[id]/page.tsx           # Trend detail + analysis + brief form
│  ├─ create/[jobId]/page.tsx       # Result: Film guide OR AI video
│  └─ api/
│     ├─ trends/route.ts            # GET  list trends (cached)        — WS1
│     ├─ trends/refresh/route.ts    # POST run Apify, rebuild trends   — WS1
│     ├─ trends/[id]/analyze/route.ts # POST Gemini analysis          — WS2
│     ├─ create/guide/route.ts      # POST Option A                    — WS3
│     ├─ create/video/route.ts      # POST Option B (start fal job)    — WS4
│     └─ create/video/[jobId]/route.ts # GET poll fal job status       — WS4
├─ lib/
│  ├─ types.ts                      # SHARED CONTRACTS (§4) — written FIRST
│  ├─ store.ts                      # shared JSON read/write: readSeed, readData, writeData, readDataOrSeed, isSeedMode
│  ├─ storyboard.ts                 # brief → fal shot prompts (Gemini) — WS4
│  ├─ apify.ts                      # WS1
│  ├─ trends.ts                     # clustering + scoring — WS1
│  ├─ gemini.ts                     # WS2
│  ├─ prompts.ts                    # all LLM prompts — WS2/WS3
│  └─ fal.ts                        # WS4
├─ components/                      # WS5
├─ seed/
│  ├─ trends.json                   # 8–12 real trends captured early in the hackathon
│  └─ analyses.json                 # pre-computed analyses for the demo trends
└─ data/                            # runtime cache (gitignored)
```

---

## 4. Shared contracts (`lib/types.ts`) — WRITE THIS FIRST, then everyone builds against it

```ts
export type Platform = "tiktok" | "instagram" | "youtube";
export type TrendType = "sound" | "music" | "format";
export type TrendStage = "rising" | "peaking" | "fading";

export interface RawVideo {
  id: string;
  platform: Platform;
  url: string;              // public post URL
  videoUrl?: string;        // direct mp4 if the scraper provides it (needed for Gemini)
  coverUrl?: string;
  caption: string;
  hashtags: string[];
  soundId?: string;
  soundTitle?: string;
  soundAuthor?: string;
  isOriginalSound?: boolean;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;        // ISO
  durationSec?: number;
  region?: string;
}

export interface Trend {
  id: string;               // slug
  type: TrendType;
  title: string;            // e.g. "‘Espresso’ hand-choreo" or "Before/after reveal transition"
  soundTitle?: string;
  soundAuthor?: string;
  hashtags: string[];
  platforms: Platform[];
  videoCount: number;
  totalPlays: number;
  avgEngagementRate: number;    // (likes+comments+shares)/plays
  momentumScore: number;        // 0–100, see §6.3
  stage: TrendStage;
  sampleVideos: RawVideo[];     // top 3–5
  updatedAt: string;
}

export interface TrendAnalysis {
  trendId: string;
  summary: string;              // 1–2 sentences
  category: "dance" | "acting" | "lipsync" | "transition" | "product" | "pov" | "other";
  hasHumans: boolean;
  hook: string;                 // what happens in the first 1–2 s
  structure: { t: string; beat: string }[];   // timeline, e.g. {t:"0-2s", beat:"..."}
  whyItWorks: string[];
  audioNotes: string;           // tempo/BPM estimate, drops, where the beat hits
  brandFit: { goodFor: string[]; avoidFor: string[] };
  prediction: {
    stage: TrendStage;
    peakEstimate: string;       // e.g. "next 3–5 days"
    confidence: number;         // 0–1
    reasoning: string;
  };
}

export interface BrandBrief {
  brandName: string;
  product: string;
  audience: string;
  tone: "fun" | "premium" | "edgy" | "wholesome" | "informative";
  goal: "awareness" | "engagement" | "sales";
  productImageUrl?: string;     // uploaded to fal storage
  language?: string;            // default "en"
}

export interface FilmGuide {           // Option A
  trendId: string;
  concept: string;
  totalDurationSec: number;
  soundInstruction: string;            // "Use sound X from the TikTok library, start at 0:12"
  setup: {
    location: string;
    lighting: string;
    camera: string;                    // device, orientation 9:16, fps, stabilization
    wardrobe: string;
    props: string[];
    people: string;                    // how many, roles
  };
  shots: {
    index: number;
    timecode: string;                  // "0.0–1.5s"
    onBeat?: string;                   // "lands on beat 1 of the drop"
    angle: string;                     // eye-level / low / high / top-down / POV
    framing: string;                   // wide / medium / close-up / ECU
    cameraMovement: string;            // static / push-in / whip pan / handheld
    action: string;                    // what the performer/product does
    performanceNotes?: string;         // acting: emotion/expression; dance: move description
    onScreenText?: string;
    transition?: string;
  }[];
  danceBreakdown?: { count: string; move: string }[];   // only for dance trends
  caption: string;
  hashtags: string[];
  postingTips: string[];
}

export interface VideoJob {             // Option B
  jobId: string;                        // fal request_id
  trendId: string;
  status: "queued" | "running" | "done" | "error";
  storyboard: { shot: number; prompt: string; durationSec: number }[];
  model: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}
```

---

## 5. Parallel workstreams (one Manus agent / one developer each)

Two humans: **Dev 1 = Nesly (Windows + Android)**, **Dev 2 = teammate (Mac + iPhone)**. Each human supervises 2–3 agents. Everybody pulls `lib/types.ts` from `main` first.

| WS | Owner | Agent task | Inputs | Output (definition of done) |
|----|-------|-----------|--------|-----------------------------|
| **WS0** | Dev 1 | Scaffold Next.js + Tailwind + shadcn, add `lib/types.ts`, env template, push to GitHub, deploy empty app to Vercel | — | Repo + live URL in **≤20 min** |
| **WS1** | Dev 1 | **Trend ingestion & scoring** — `lib/apify.ts`, `lib/trends.ts`, `/api/trends`, `/api/trends/refresh`. Capture `seed/trends.json` early. | Apify token | `GET /api/trends` returns `Trend[]` sorted by momentum |
| **WS2** | Dev 2 | **Gemini analysis** — `lib/gemini.ts`, prompts, `/api/trends/[id]/analyze`. Upload the sample video to Gemini (Files API) → return `TrendAnalysis` JSON. Pre-compute `seed/analyses.json`. | Gemini key, `Trend` | Valid `TrendAnalysis` for 5+ trends |
| **WS3** | Dev 2 | **Option A Film Guide** — `/api/create/guide` | `Trend`, `TrendAnalysis`, `BrandBrief` | Valid `FilmGuide` JSON |
| **WS4** | Dev 1 | **Option B fal pipeline** — `lib/fal.ts`, `/api/create/video`, polling route, product-image upload | fal key | MP4 URL of a 9:16 branded video |
| **WS5** | Dev 2 | **Frontend** — all pages + components with mock data from `seed/` until APIs land | types + seed | Polished, mobile-responsive UI |

Integration rule: **every API route must work with `USE_SEED_DATA=true`** so the frontend never blocks on scraping or keys.

---

## 6. Detailed specs per workstream

### 6.1 WS1 — Apify ingestion

**Actors (verify IDs/inputs in the Apify Console first; pick the one with recent runs and good ratings):**

| Need | Suggested actor |
|------|-----------------|
| TikTok trending videos | `clockworks/tiktok-trends-scraper` or `clockworks/tiktok-scraper` (hashtag/search mode) |
| TikTok trending sounds/songs | `lexis-solutions/tiktok-trending-songs-scraper` or `clockworks/tiktok-sound-scraper` |
| Instagram Reels (P1) | `apify/instagram-reel-scraper` |
| YouTube Shorts (P1) | `streamers/youtube-shorts-scraper` |

Rules:
- Keep runs small (≤50 results/run) to save credits and time (~20–60 s per run).
- Call `client.actor(id).call(input)` then `client.dataset(run.defaultDatasetId).listItems()`.
- **Normalize** every actor's output into `RawVideo` (field names differ per actor — map them in one function per actor).
- If the scraper doesn't return a direct mp4 (`videoUrl`), enable the download option if the actor has one; otherwise WS2 falls back to cover image + caption analysis.
- Write results to `data/raw-YYYY-MM-DD.json`. In the **first 45 minutes**, run once and copy the result to `seed/trends.json`.

**Clustering (`lib/trends.ts`)**, simple and deterministic:
1. Group by `soundId` when ≥2 videos share it → `type: "sound"` (or `"music"` if `isOriginalSound === false`, i.e. a commercial track).
2. Remaining videos: group by top shared hashtag (excluding generic ones: fyp, foryou, viral, trending, reels, shorts) → `type: "format"`.
3. Keep the top 12 trends.

### 6.2 WS2 — Gemini analysis

- SDK: `@google/genai`. Model: `gemini-2.5-flash` by default; `gemini-2.5-pro` for the hero demo trend.
- Download the sample mp4 server-side → upload with the Files API → wait for state `ACTIVE` → `generateContent` with the video + prompt.
- Force JSON output: `responseMimeType: "application/json"` + `responseSchema` matching `TrendAnalysis`.
- Analyze **1–2 sample videos per trend** (not all of them) to stay fast.
- Cache the result in `data/analyses.json` keyed by `trendId`. Never analyze the same trend twice.

Prompt skeleton (`lib/prompts.ts`):
```
You are a short-form video strategist. Watch this {platform} video that belongs to the trend "{title}"
(sound: {soundTitle}; hashtags: {hashtags}; {videoCount} videos, {totalPlays} plays, momentum {momentumScore}/100).
Explain exactly how the trend works so a brand could replicate it. Identify: category, whether humans appear,
the hook in the first 2 seconds, a second-by-second structure, why it's viral, audio notes (BPM estimate, where the
drop/beat hits), which brand categories it fits or should avoid, and predict its lifecycle stage and peak window.
Return JSON only, matching the schema.
```

### 6.3 Momentum score and future-trend prediction (our "predict the future" feature)

Computed in `lib/trends.ts` from scraped numbers. No model needed:

```
recency      = share of the trend's videos posted in the last 72 h          (0–1)
velocity     = median(plays / hoursSincePosted) across the trend, normalized against all trends  (0–1)
engagement   = avgEngagementRate normalized                                  (0–1)
saturation   = videoCount normalized (more videos = more saturated)          (0–1)

momentumScore = 100 * (0.35*velocity + 0.30*recency + 0.20*engagement + 0.15*(1 - saturation))

stage = rising  if recency > 0.5 and saturation < 0.5
        peaking if velocity high and saturation >= 0.5
        fading  otherwise
```
Gemini then adds `prediction.peakEstimate` + `reasoning` on top. In the UI, show an **"Early Signal" badge** for rising trends with low video count but high velocity. That is the "catch it before it peaks" pitch moment.

### 6.4 WS3 — Option A: Film It Yourself

- Input: `Trend` + `TrendAnalysis` + `BrandBrief`. Model: `gemini-2.5-flash` with a JSON schema = `FilmGuide`.
- Prompt must branch on `analysis.category`:
  - **dance** → fill `danceBreakdown` (8-counts aligned to the beat from `audioNotes`), simple moves a non-dancer can do, where the product appears.
  - **acting / pov / lipsync** → `performanceNotes` per shot: expression, line delivery, pauses, eye-line.
  - **no humans (product / transition)** → product-only shot list: surface, background, hand-model actions, transition technique.
- Always include: 9:16 vertical, 1080×1920, 30 fps (60 for fast dance), lighting setup (key/fill, window light or ring light), and the hook in the first 1.5 s.
- **Sound rule:** tell the user to add the trending sound **inside the TikTok/Instagram app** (licensed in-platform). Never ask them to rip the audio.
- UI renders it as a **shot-list card timeline** + "Copy as text" + "Download PDF" (P1).

### 6.5 WS4 — Option B: AI video with fal.ai

Pipeline:
1. **Storyboard** (Gemini): turn `Trend` + `TrendAnalysis` + `BrandBrief` into 1–3 shots, each with a dense visual prompt (subject, action, camera move, lighting, style, 9:16) of 5–8 s.
2. **(Optional) Keyframe**: if the user uploaded a product image, use it directly as the start frame (image-to-video). Otherwise generate a keyframe with a fal image model (e.g. a Flux endpoint) for brand consistency.
3. **Video**: call a fal video model via queue mode:
   ```ts
   import { fal } from "@fal-ai/client";
   fal.config({ credentials: process.env.FAL_KEY });
   const { request_id } = await fal.queue.submit(MODEL_ID, { input: {...} });
   // poll: fal.queue.status(MODEL_ID, { requestId }) → fal.queue.result(...)
   ```
4. **Return** `VideoJob`; the frontend polls `/api/create/video/[jobId]` every 3 s and shows progress.

Model choice (check the exact endpoint IDs + input fields on each model's fal.ai page / `https://fal.ai/models/<id>/llms.txt` before coding):

| Use | Model | Why |
|-----|-------|-----|
| **Default (fast + cheap)** | Kling 2.5 Turbo Pro text-to-video / image-to-video (`fal-ai/kling-video/v2.5-turbo/pro/...`) | ~$0.07/s, good motion |
| **Hero demo clip** | Veo 3.1 Fast (or Veo 3.1) | Native audio, 9:16. Expensive (~$0.40/s at full quality): use it 1–3 times max |
| Alternative | Seedance / Kling 3.0 | If Kling 2.5 quality is poor |
| Voiceover (P1) | a fal TTS endpoint (e.g. ElevenLabs on fal) | Brand line read-out |
| Upload | `fal.storage.upload(file)` | Product image → URL |

**Budget: $50 fal credits.** ≈ 8 s × $0.07 ≈ $0.56 per Kling clip. Hard-cap in code: max 3 shots per job, max duration 8 s/shot. **Pre-generate the hero demo video before the pitch** and store its URL in `seed/`.
**Audio:** AI videos use original/generated audio (Veo native audio or a "music-style" description). We do NOT embed copyrighted trending songs; the UI says "Add trending sound <X> when posting".

### 6.6 WS5 — Frontend

Pages:
1. **Trend Radar (`/`)**: header with "Last updated" + "Refresh trends" button; filter chips (All / Sound / Music / Format / Rising only); grid of `TrendCard` (cover, title, sound, platform icons, momentum bar, stage badge, "Early Signal" badge, plays).
2. **Trend Detail (`/trend/[id]`)**: embedded sample video(s) (TikTok embed or cover + link), analysis sections (Hook, Timeline, Why it works, Audio, Brand fit, Prediction gauge). Brand Brief form below. Two big CTAs: **🎬 Film It Yourself** and **✨ Generate with AI**.
3. **Result (`/create/[jobId]`)**: Option A → shot-list timeline cards; Option B → progress states ("Writing storyboard → Generating shot 1/2 → Done") then a 9:16 video player + download.

Design: dark theme, bold accent (electric pink/cyan, TikTok-ish), mobile-first (must look great on a phone browser), skeleton loaders everywhere (analysis takes 10–30 s, video 1–3 min).

---

## 7. 4-hour timeline

| Time | Dev 1 (Windows) | Dev 2 (Mac) | Milestone |
|------|-----------------|-------------|-----------|
| 0:00–0:20 | WS0 scaffold + types + Vercel | Get Gemini key, test a video analysis in AI Studio; set up Apify + fal keys | Repo live |
| 0:20–1:15 | WS1 Apify → **capture seed data by 0:45** | WS5 UI on seed data + WS2 analysis route | Trends render |
| 1:15–2:15 | WS4 fal pipeline (test with a hardcoded prompt first) | WS2 finish + WS3 Film Guide | Both options return JSON / MP4 |
| 2:15–3:00 | Integrate Option B into UI, pre-generate hero video | Integrate analysis + Option A into UI, pre-compute analyses | **Feature freeze at 3:00** |
| 3:00–3:30 | Bug fixes, `USE_SEED_DATA=true` on prod | Polish UI, mobile check | Stable demo |
| 3:30–4:00 | Rehearse pitch ×2, record backup screen video | Slides (3–4) | Submit |

**Rule:** if anything is not working at 2:45, cut it and use seed data. A working demo beats more features.

---

## 8. Demo script (2–3 min)

1. **Problem (15 s):** Trends live 3–7 days; brands take 2–3 weeks to produce content. They always arrive late.
2. **Trend Radar (30 s):** "Every day TrendForge scans TikTok, Reels and Shorts." Show the momentum scores and point at an **Early Signal** trend: "This one is about to peak in ~4 days."
3. **Analysis (30 s):** open it. AI watched the video: hook, beat timeline, why it works, brand fit.
4. **Option A (30 s):** enter the brand brief → shot-by-shot guide with angles, lighting, dance counts on the beat.
5. **Option B (30 s):** "No crew? Generate it." Show the pre-generated fal video (start a live job in parallel).
6. **Close (15 s):** "From trend to ready-to-post ad in minutes, not weeks." Business model: SaaS per brand seat / agencies.

---

## 9. Risks & fallbacks

| Risk | Fallback |
|------|----------|
| Apify actor slow / blocked | `USE_SEED_DATA=true` |
| No direct mp4 from the scraper | Analyze cover image + caption + sound metadata (fal `openrouter/router/vision` or Gemini with image) |
| Gemini rate limit | Use cached `seed/analyses.json`; fallback LLM via fal `fal-ai/any-llm` |
| fal video takes >3 min on stage | Show the pre-generated hero video; live job runs in the background |
| fal credits run out | Hard caps in §6.5; Kling instead of Veo |
| Vercel function timeout (long jobs) | Use fal **queue + polling**, never wait synchronously; set `export const maxDuration = 60` on analysis routes |
| Windows/Mac env differences | Node 20 LTS on both; use `npm` only; no OS-specific scripts |

---

## 10. Agent rules (for every AI agent reading this)

1. Build only your workstream; import types from `lib/types.ts`; do not redefine them.
2. Every endpoint returns typed JSON; on error return `{ error: string }` with status 500. Never crash the page.
3. Every endpoint must work in seed mode.
4. Keys are server-side only.
5. Verify every external endpoint ID / actor ID / input field against its live docs before using it. Docs: fal → `https://fal.ai/models/<id>/llms.txt`, Gemini → `ai.google.dev/gemini-api/docs`, Apify → actor page "API" tab.
6. Keep code minimal and production-clean: no dead code, no placeholder TODOs in demo paths.
7. Follow the Git workflow in §11 exactly.
8. Dance trends: use the Dance AI service (§12), never build new pose/beat code.

---

## 11. Git workflow

**Repo:** https://github.com/nesly29101923/trendforge (private, GitHub). Default branch: `main`. Dev 1 owns `main` and does all merges.

### 11.1 One-time setup (Dev 1, during WS0)

1. ✅ Done: private repo created at https://github.com/nesly29101923/trendforge
2. ✅ Done: Dev 2 (MaverickTC) invited as collaborator; he must accept the invite email/notification.
3. Scaffold the app locally, then add the files below and push:
   ```bash
   git init
   git add .
   git commit -m "chore: scaffold + shared types"
   git branch -M main
   git remote add origin https://github.com/nesly29101923/trendforge.git
   git push -u origin main
   ```
4. Connect the repo to Vercel (import from GitHub). Every push to `main` then auto-deploys, and every branch gets a preview URL.
5. Give each Manus agent access to the repo (through Manus's GitHub connection). If an agent can't push, it delivers its files and its human owner commits them.

### 11.2 Files that must exist in the first commit

`.gitignore`
```
node_modules/
.next/
.env*.local
.env
data/
.vercel/
*.log
.DS_Store
Thumbs.db
```

`.gitattributes` (**critical: Windows + Mac team**, prevents CRLF/LF conflicts on every file)
```
* text=auto eol=lf
*.png binary
*.jpg binary
*.mp4 binary
```

`.env.example` (committed, no values) — copy of §2.1. **Real keys go only in `.env.local` and the Vercel dashboard. Never commit keys.**

`seed/` **is committed** (the demo depends on it). `data/` is not.

### 11.3 Branches = workstreams

| Branch | Owner | Folders it may touch |
|--------|-------|----------------------|
| `ws1-ingestion` | Dev 1 | `lib/apify.ts`, `lib/trends.ts`, `app/api/trends/**`, `seed/trends.json` |
| `ws2-analysis` | Dev 2 | `lib/gemini.ts`, `lib/prompts.ts`, `app/api/trends/[id]/analyze/**`, `seed/analyses.json` |
| `ws3-film-guide` | Dev 2 | `app/api/create/guide/**`, guide prompts in `lib/prompts.ts` |
| `ws4-fal-video` | Dev 1 | `lib/fal.ts`, `lib/storyboard.ts`, `app/api/create/video/**` |
| `ws5-frontend` | Dev 2 | `app/page.tsx`, `app/trend/**`, `app/create/**`, `components/**` |
| `ws6-dance-coach` | Dev 1 | `app/api/dance/**`, `components/dance-coach.tsx`, `lib/dance-engine-html.ts`, `seed/dance-demo.json` (P1, §12) |

**Dependencies are already installed on `main`:** `@google/genai`, `apify-client`, `@fal-ai/client` (Next.js 15, Tailwind 4). Use `lib/store.ts` for all JSON reads/writes so seed mode works everywhere (on Vercel, runtime data goes to `/tmp`).

**File-ownership rule:** an agent edits only the files listed for its branch. `lib/types.ts`, `package.json` and `.env.example` are changed only by Dev 1 on `main`. Anyone needing a type change or a new dependency asks Dev 1. This is what prevents merge conflicts.

### 11.4 Daily loop (every ~30 min)

```bash
git checkout ws2-analysis
git pull origin main            # pick up others' work + type changes
# ...work...
git add -A
git commit -m "feat(ws2): gemini video analysis route"
git push origin ws2-analysis
```
Then open a Pull Request into `main`. Dev 1 merges (squash) after checking that `npm run build` passes on the Vercel preview.

Commit message prefixes: `feat(wsN):`, `fix(wsN):`, `chore:`.

### 11.5 Merge order (matches the timeline in §7)

1. `main` scaffold + types (0:20)
2. `ws5-frontend` with seed data and `ws1-ingestion` (~1:15)
3. `ws2-analysis`, then `ws3-film-guide` (~2:15)
4. `ws4-fal-video` (~2:15)
5. `ws6-dance-coach` (P1, only if P0 is green, ~2:45)
6. **3:00 freeze:** only `fix:` commits to `main` after this. Tag the demo build: `git tag demo && git push --tags`.

### 11.6 Rescue commands

- Conflict in a file you don't own → keep main's version: `git checkout --theirs <file>` during the merge, or ask the owner.
- Broke `main` before the pitch → redeploy the `demo` tag (or the last green deployment) from the Vercel dashboard ("Promote to Production").

---

## 12. Reuse: Dance AI (our existing project) → Dance Coach (WS6, P1)

We already built **Dance AI** (`github.com/nesly29101923/dance-ai`, private; Dev 1 grants access). It does in production-quality code what TrendForge's dance trends need. **Do not rewrite any of it — call it as a service and embed its engine.**

### 12.1 What already exists

| Part | Path in dance-ai | What it gives TrendForge |
|------|------------------|--------------------------|
| Audio analysis | `server/app/audio.py` (librosa) | Real tempo, beat times, downbeat, per-4-beat energy, best 30 s window → replaces Gemini's BPM *estimate* in `audioNotes` and makes Film Guide 8-counts land exactly on the beat |
| Choreography composer | `server/app/composer.py`, `moves.py` (43 original moves) | `POST /v1/generate` — sound → original dance |
| Video → routine | `server/app/video.py` (MediaPipe PoseLandmarker) | `POST /v1/from-video` — a dance video → learnable routine (same JSON) |
| Dance engine | `engine/` (TypeScript → esbuild bundle `app/src/engine/engine-html.ts`) | Self-contained HTML: animated silhouette "shadow coach", learn mode (speed, 8-count loop, mirror), webcam pose scoring (PERFECT/GREAT/GOOD/MISS) |

API (FastAPI, port 8000):
- `GET /v1/health` → `{"ok": true, ...}`
- `POST /v1/generate` multipart field `audio` → `{ dance, audio: { mime, base64 } }`
- `POST /v1/from-video` multipart field `video` → same shape (fails clearly if < 30 % of frames show a person)

Dance JSON: `{version, id, title, style, difficulty, seed, tempo, window{start,end}, beats[], downbeatIndex, segments[{unit, moveId, name, startBeat, beats, startTime, endTime, level, hook}], moves{id: {keyframes[{beat, pose}]}}}`. Pose = absolute limb angles in degrees (0 = down, 90 = screen-right, 180 = up).

### 12.2 How it plugs into TrendForge

```
Trend (category = "dance")
  └─ Trend Detail → "Dance Coach" tab
        1. Advertiser uploads the reference/brand dance clip they have rights to (or a sound file)
        2. Next.js route /api/dance  ──proxy──▶  DANCE_API_URL/v1/from-video  (or /v1/generate for audio)
        3. Response { dance, audio } → rendered by the Dance AI engine in an <iframe srcDoc>
        4. Film Guide (Option A) uses dance.beats[] + segments[] for exact timecodes and 8-counts
```

New env var: `DANCE_API_URL=` (server-side only).

Hosting the Python server for the demo, in order of preference:
1. **Deploy the dance-ai `server/` with its existing Dockerfile** to a free container host (e.g. Render or Railway) → stable public URL, works away from home Wi-Fi.
2. Run `server\start.bat` on Dev 1's Windows PC and expose port 8000 with a tunnel (e.g. cloudflared). Vercel can't reach `192.168.x.x`.

Python can't run on Vercel, so the server always runs separately.

### 12.3 WS6 task (Dev 1, start only after P0 is merged, ~2:15)

| Step | Definition of done |
|------|--------------------|
| Host dance-ai server (§12.2) | `DANCE_API_URL/v1/health` returns ok from the internet |
| `app/api/dance/route.ts` | Streams the uploaded file to the right endpoint, 240 s timeout, returns `{ dance, audio }` |
| `components/dance-coach.tsx` | Loads the engine HTML from `engine-html.ts` (copy the built file into `lib/dance-engine-html.ts`) into an iframe; sends it the dance + audio using **the same message protocol as `app/src/components/engine-view.tsx` in dance-ai** (read that file; replace React Native `postMessage` with `iframe.contentWindow.postMessage`) |
| Film Guide integration | When a `dance` result exists, WS3 passes `beats`/`segments` into the guide prompt and fills `danceBreakdown` from `segments[].name` |
| Seed | Save one `dance` result to `seed/dance-demo.json` so the demo works offline |

Branch: `ws6-dance-coach`. Files: `app/api/dance/**`, `components/dance-coach.tsx`, `lib/dance-engine-html.ts`, `seed/dance-demo.json`.

### 12.4 Rules carried over from Dance AI

- **Never download or rip audio/video from TikTok, YouTube, Instagram or Spotify into the Dance Coach.** The input is a file the advertiser uploads and has rights to. Scraped trend videos are only analysed for the trend breakdown (§6.2), never redistributed.
- The 43 moves are our own; do not import AIST++/SMPL or other research datasets (non-commercial licences).
- The engine's MediaPipe model loads from a CDN on first use (~6 MB) → needs internet on the demo device.
- Known gotchas: the dance-ai Windows setup needs `npm.cmd`/`npx.cmd` (PowerShell blocks `npm.ps1`), and inbound port 8000 must be allowed in Windows Firewall if served from the PC.

---

## 13. API contract (implemented — frontend codes against this)

All routes return JSON. Errors: `{ error: string }` with status 4xx/5xx.

| Method | Route | Body / params | Returns | Status |
|--------|-------|---------------|---------|--------|
| GET | `/api/trends` | — | `Trend[]` sorted by momentum | ✅ WS1 |
| GET | `/api/trends/[id]` | — | `Trend` | ✅ WS1 |
| POST | `/api/trends/refresh` | `{ queries?: string[] }` | `Trend[]` (runs Apify, 1–4 min) | ✅ WS1 |
| GET | `/api/trends/[id]/analyze` | — | cached `TrendAnalysis` or 404 | ✅ |
| POST | `/api/trends/[id]/analyze` | — | `TrendAnalysis` (Gemini watches the top video; falls back to cover image, then metadata) | ✅ |
| POST | `/api/create/guide` | `{ trendId, brief: BrandBrief }` | `FilmGuide` | ✅ |
| GET | `/api/trends/[id]/hashtags` | — | `HashtagStat[]` (instant, data only) | ✅ |
| POST | `/api/trends/[id]/hashtags` | — | `TrendHashtags` (AI pick + caption + tip, cached per trend) | ✅ |
| POST | `/api/publish` | `{ trendId, brief, draftCaption?, draftHashtags?, concept? }` | `{ plan: PublishPlan, stats: HashtagStat[], insights: CaptionInsights }` | ✅ |
| POST | `/api/score` | multipart `video`, `trendId`, `brandName?`, `product?` | `ViralScore` | ✅ |
| POST | `/api/create/video/upload` | multipart `file` (image ≤10 MB) | `{ url }` → put in `brief.productImageUrl` | ✅ WS4 |
| POST | `/api/create/video` | `{ trendId or trend, brief: BrandBrief, analysis?, quality?: "fast" \| "hero" }` | `VideoJob` (status `queued`) | ✅ WS4 |
| GET | `/api/create/video/[jobId]` | — | `VideoJob` without `storyboard`; poll every 3 s until `done` / `error` | ✅ WS4 |

Notes:
- `isEarlySignal(trend)` is exported from `lib/trends.ts` for the "Early Signal" badge.
- Video: one clip per job. `fast` = Kling 2.5 Turbo Pro, 10 s, ~$0.70. `hero` = Veo 3.1 Fast, 8 s 720p with native audio, ~$1.20. With a product image, Kling image-to-video is used (output follows the image's aspect ratio, so upload a 9:16 image). The jobId is self-contained (encodes the fal request), so polling works on any serverless instance.
- Seed mode: if `seed/video-demo.json` (a `VideoJob` with `status: "done"`) exists, `POST /api/create/video` returns it.
- Analysis cache: WS2 must store analyses as `Record<trendId, TrendAnalysis>` under the name `analyses` via `lib/store.ts` (`writeData("analyses", …)`), because the video route reads them from there.

---

## 14. Viral Score (the "more views" outcome)

The advertiser uploads a **draft video** on a trend page → Gemini watches it against that trend's analysis and returns:
- `score` 0–100 now, `scoreAfterFixes` 0–100 if every fix is applied
- 7 criteria scored 0–10: hook, trend fidelity, beat sync, retention/loop, visual quality, brand integration, CTA & caption
- prioritised fixes with timecodes and expected impact
- **expected views before vs after**: benchmark = median plays of the trend's top videos, scaled by `0.05 + 1.2 × (score/100)²`, shown as a ±50 % range. The jump from "before" to "after" is the stage moment.

Large uploads: Vercel caps request bodies at ~4.5 MB, so **demo the Viral Score from `npm run dev` on the laptop** (no cap, up to 100 MB) or keep demo drafts under 4 MB.

---

## 15. Post Optimizer (hashtags, caption, how to share)

Shown on every trend page and on both result pages (after a Film Guide or an AI video).

1. **Hashtag data, no AI** (`lib/hashtags.ts`): every hashtag in today's scraped videos is ranked by median plays (60 %), engagement rate (30 %) and usage (10 %), and tagged `trend` / `broad` / `niche`.
2. **Caption patterns, no AI**: from the best-performing videos: median caption length, median hashtag count, share that ask a question / use emoji / have a CTA, and the UTC hours the top videos were posted.
3. **AI posting plan** (`lib/publish.ts`, Gemini, fed only the real numbers above): a 4–7 tag set with a role and a data-backed reason for each, 3 caption variants, a pinned first comment, cover text, per-platform versions (TikTok, Reels, Shorts with a searchable title), when to post, a first-hour engagement checklist and what to avoid.
4. **Caption check**: if the user pastes their own caption/hashtags, it is scored 0–100 with fixes.

---

## 16. Recommended hashtags (automatic, per trend)

As soon as a trend is opened, a card at the top of the trend page shows 6–8 recommended hashtags for posting a video in that trend, with no form and no button:
roles `trend` / `broad` / `niche` / `community`, a one-line reason each (citing today's scraped numbers), a ready caption, a posting tip and "Copy caption + hashtags".
Data ranking is instant (`GET`), the AI pick follows in a few seconds (`POST`, cached in `data/trend-hashtags.json`). Filler tags (fyp, viral, trending…) are filtered in code.
