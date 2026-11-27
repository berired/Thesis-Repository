/**
 * The only two calls to the AI provider (Cloudflare Workers AI): turn text into vectors, and
 * write structured JSON from a prompt. Plain fetch, no SDK. Swap the provider by changing
 * this file only.
 */

export const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
export const GENERATE_MODEL = "@cf/meta/llama-3.1-8b-instruct";
export const EMBED_DIMENSIONS = 768;

const TIMEOUT_MS = 20_000;

export class AiUnavailableError extends Error {}

function settings() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!account || !token) throw new AiUnavailableError("Workers AI is not configured.");
  return { account, token };
}

async function run<T>(model: string, body: unknown): Promise<T> {
  const { account, token } = settings();
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    result?: T;
    errors?: { message?: string }[];
  } | null;
  if (!res.ok || !json?.success || json.result === undefined) {
    // Never include the request (it can carry pet details) or any credential in the message.
    const why = json?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(`Workers AI ${model} failed: ${why}`);
  }
  return json.result;
}

/** One 768-number vector per text, in the same order. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const result = await run<{ data: number[][] }>(EMBED_MODEL, { text: texts });
  if (
    !Array.isArray(result.data) ||
    result.data.length !== texts.length ||
    result.data.some((v) => v.length !== EMBED_DIMENSIONS)
  ) {
    throw new Error("Workers AI returned embeddings in an unexpected shape.");
  }
  return result.data;
}

/** The text as the string form pgvector accepts: [0.1,0.2,...]. */
export function toVectorLiteral(vector: number[]) {
  return `[${vector.join(",")}]`;
}

/** Asks the model for JSON matching `schema`. Returns the parsed value, unvalidated. */
export async function generateJson(
  system: string,
  user: string,
  schema: Record<string, unknown>,
): Promise<unknown> {
  const result = await run<{ response?: unknown }>(GENERATE_MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_schema", json_schema: schema },
    max_tokens: 700,
    temperature: 0.2,
  });
  const out = result.response;
  if (typeof out === "string") {
    try {
      return JSON.parse(out);
    } catch {
      throw new Error("The model did not return valid JSON.");
    }
  }
  return out;
}
