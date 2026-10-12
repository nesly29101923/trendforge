// Pre-computes Gemini analyses for every trend and writes seed/analyses.json.
// Usage: start `npm run dev`, then `node scripts/precompute-analyses.mjs [baseUrl] [--force]`
import { readFile, writeFile } from "node:fs/promises";

const base = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const force = process.argv.includes("--force");
const seedPath = new URL("../seed/analyses.json", import.meta.url);

const seed = JSON.parse(await readFile(seedPath, "utf8").catch(() => "{}"));
const trends = await fetch(`${base}/api/trends`).then((r) => r.json());
if (!Array.isArray(trends)) throw new Error(`GET /api/trends failed: ${JSON.stringify(trends)}`);

for (const trend of trends) {
  if (seed[trend.id] && !force) {
    console.log(`skip  ${trend.id}`);
    continue;
  }
  const started = Date.now();
  const res = await fetch(`${base}/api/trends/${encodeURIComponent(trend.id)}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trend, force }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.log(`FAIL  ${trend.id}: ${body.error}`);
    continue;
  }
  seed[trend.id] = body;
  await writeFile(seedPath, JSON.stringify(seed, null, 2) + "\n");
  console.log(`ok    ${trend.id} (${body.category}, ${((Date.now() - started) / 1000).toFixed(1)}s)`);
}
console.log(`\n${Object.keys(seed).length} analyses in seed/analyses.json`);
