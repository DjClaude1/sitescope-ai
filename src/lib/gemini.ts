import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const isGeminiConfigured = Boolean(apiKey);

export function getGemini() {
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function cleanJson(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "");
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  return t.trim();
}

const DEFAULT_MODELS = [
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];

function isModelNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /not found|is not supported|does not exist|\b404\b/i.test(msg);
}

export async function geminiJSON<T>(prompt: string, opts?: { model?: string }): Promise<T> {
  const client = getGemini();
  if (!client) throw new Error("GEMINI_API_KEY missing");
  const override = process.env.GEMINI_MODEL;
  const candidates = opts?.model
    ? [opts.model]
    : override
      ? [override, ...DEFAULT_MODELS.filter((m) => m !== override)]
      : DEFAULT_MODELS;

  let lastErr: unknown;
  for (const modelName of candidates) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        return JSON.parse(cleanJson(text)) as T;
      }
    } catch (err) {
      lastErr = err;
      if (!isModelNotFound(err)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini: no supported model");
}
