// Unit B2.1a — single Groq call (vision + text + reviews together).
// MAX_IMAGES is capped at 3 pending the B2.0 spike result. If the spike
// confirms token usage is comfortably under 8,000 TPM with 5 images, raise
// it to 5. If it's still tight at 3, drop to 2.

import Groq from 'groq-sdk';
import { ModelSignalSchema, type ModelSignals } from './schema';
import { buildAnalysisPrompt } from './prompts';
import type { AnalyzeRequest } from '../../../shared/types';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VISION_MODEL = process.env.GROQ_MODEL_VISION ?? 'qwen/qwen3.6-27b';
const TIMEOUT_MS = 4000;
const MAX_IMAGES = 3;

export interface ModelCallResult {
  signals: ModelSignals | null;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  latencyMs: number;
  error: string | null;
}

export async function extractSignals(req: AnalyzeRequest): Promise<ModelCallResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: buildAnalysisPrompt(req) },
  ];
  for (const url of req.images.slice(0, MAX_IMAGES)) {
    content.push({ type: 'image_url', image_url: { url } });
  }

  try {
    const completion = await client.chat.completions.create(
      {
        model: VISION_MODEL,
        messages: [{ role: 'user', content: content as any }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 500,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw);
    const signals = ModelSignalSchema.parse(parsed);

    const usage = completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : null;

    return { signals, usage, latencyMs, error: null };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    return { signals: null, usage: null, latencyMs: Date.now() - start, error: message };
  }
}
