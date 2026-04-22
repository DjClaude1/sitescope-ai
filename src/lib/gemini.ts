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

export async function geminiJSON<T>(prompt: string, opts?: { model?: string }): Promise<T> {
  const client = getGemini();
  if (!client) throw new Error("GEMINI_API_KEY missing");
  const modelName = opts?.model || "gemini-1.5-flash-latest";
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
}
