// scripts/spike-vision-test.ts
//
// Unit B2.0 — the 30-minute spike, before writing any real service code.
// Run: npx tsx scripts/spike-vision-test.ts
//
// Before running: replace CLEAN_IMAGES / HIGH_RISK_IMAGES below with the
// actual public URLs of your three seeded listings (Unit F1.2). These must
// be real, reachable image URLs — Groq fetches them server-side.

import "dotenv/config";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL_VISION ?? "qwen/qwen3.6-27b";

// --- REPLACE THESE with your seeded listing image URLs ---
const CLEAN_IMAGES = [
  "https://your-mock-marketplace.example.com/seed/clean-1.jpg",
  "https://your-mock-marketplace.example.com/seed/clean-2.jpg",
];

const HIGH_RISK_IMAGES = [
  "https://your-mock-marketplace.example.com/seed/high-risk-1.jpg",
  "https://your-mock-marketplace.example.com/seed/high-risk-2.jpg",
  "https://your-mock-marketplace.example.com/seed/high-risk-3.jpg",
];
// -----------------------------------------------------------

const PROMPT = `Return ONLY a JSON object, no prose, no markdown fences:
{ "image_synthetic_probability": number between 0 and 1 — how likely these are stock photos or AI-generated rather than real photos of the actual item being sold. Look for generic studio lighting, watermarks, inconsistent shadows, or an unnaturally perfect appearance. }`;

interface CaseResult {
  label: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  response?: string;
  error?: string;
}

async function testCase(label: string, images: string[]): Promise<CaseResult> {
  const start = Date.now();
  const content: any[] = [{ type: "text", text: PROMPT }];
  for (const url of images) content.push({ type: "image_url", image_url: { url } });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      max_tokens: 100,
    });

    const latencyMs = Date.now() - start;
    const usage = completion.usage;
    const raw = completion.choices[0]?.message?.content;

    return {
      label,
      latencyMs,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      response: raw ?? undefined,
    };
  } catch (err: any) {
    return { label, latencyMs: Date.now() - start, error: err?.message ?? String(err) };
  }
}

function printResult(r: CaseResult) {
  console.log(`\n--- ${r.label} ---`);
  if (r.error) {
    console.log("ERROR:", r.error);
    return;
  }
  console.log("latency_ms:", r.latencyMs);
  console.log(
    "tokens — prompt:", r.promptTokens, "completion:", r.completionTokens, "total:", r.totalTokens
  );
  console.log("response:", r.response);
  if (r.totalTokens && r.totalTokens > 7000) {
    console.warn("⚠️  Within 1,000 tokens of the 8,000 TPM free-tier cap. Cap images to 2-3 or downsize before sending.");
  }
}

async function run() {
  console.log(`Testing model: ${MODEL}\n`);

  const clean = await testCase("CLEAN listing (expect LOW synthetic probability)", CLEAN_IMAGES);
  printResult(clean);

  const highRisk = await testCase("HIGH-RISK listing (expect HIGH synthetic probability)", HIGH_RISK_IMAGES);
  printResult(highRisk);

  // Discrimination check
  if (clean.response && highRisk.response) {
    try {
      const cleanScore = JSON.parse(clean.response).image_synthetic_probability;
      const riskScore = JSON.parse(highRisk.response).image_synthetic_probability;
      const gap = riskScore - cleanScore;
      console.log(`\n>>> Discrimination gap: ${gap.toFixed(2)} (clean=${cleanScore}, high-risk=${riskScore})`);
      if (gap < 0.3) {
        console.warn(">>> WEAK discrimination. The model isn't separating your seeds clearly. Revisit the prompt before wiring B2.1a.");
      } else {
        console.log(">>> Discrimination looks usable.");
      }
    } catch {
      console.warn(">>> Could not parse responses to compare — check the JSON output above manually.");
    }
  }

  // Rate-limit / stability check — this alone costs ~10 of your 1,000 daily requests.
  console.log("\n--- Repeated call test (10x) — watching for 429s ---");
  let failures = 0;
  for (let i = 0; i < 10; i++) {
    const r = await testCase(`repeat ${i + 1}`, HIGH_RISK_IMAGES);
    if (r.error) {
      failures++;
      console.log(`  call ${i + 1}: FAILED — ${r.error}`);
    } else {
      console.log(`  call ${i + 1}: ok, ${r.totalTokens} tokens, ${r.latencyMs}ms`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Failures in repeated test: ${failures}/10`);
  console.log(`Decision: if token counts stayed comfortably under 8,000 and discrimination gap >= 0.3 and no failures → build Unit B2.1a.`);
  console.log(`If tokens ran close to 8,000 → cap images to 2-3 and retest before deciding.`);
  console.log(`If discrimination is weak or calls are failing → build Unit B2.1b (Groq + Gemini hybrid).`);
  console.log(`Write the outcome into progress-tracker.md before moving on.`);
}

run();