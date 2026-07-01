import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Lazily-initialized OpenAI client. Returns null when OPENAI_API_KEY is not
 * configured so callers can degrade gracefully instead of crashing - see
 * src/services/narrative.service.ts for the fallback pattern.
 */
export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured()) {
    return null;
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}
