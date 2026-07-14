import { GoogleGenAI } from "@google/genai";
import { classifyGeminiError } from "./classify-error";

let ai: GoogleGenAI | null = null;

function getAi() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. AI ranking will fallback to keyword scoring.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export interface RankableProvider {
  id: string;
  displayName: string;
  category: string;
  mainCategory: string | null;
  shortDescription: string | null;
  trustScore: number;
  availability: string;
  city: string;
}

interface RankingResult {
  scores: Record<string, number>;
  usedAi: boolean;
}

function keywordScore(query: string, provider: RankableProvider): number {
  const q = query.toLowerCase();
  const text = [
    provider.displayName,
    provider.category,
    provider.mainCategory ?? "",
    provider.shortDescription ?? "",
  ].join(" ").toLowerCase();

  const queryWords = q.split(/\s+/).filter(Boolean);
  const matched = queryWords.filter(w => text.includes(w)).length;
  if (matched === 0) return 0;
  return Math.min(100, (matched / queryWords.length) * 100 + (text.includes(q) ? 20 : 0));
}

function basicRankProviders(
  query: string,
  providers: RankableProvider[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const p of providers) {
    scores[p.id] = keywordScore(query, p);
  }
  return scores;
}

const SYSTEM_PROMPT_RANK = `Eres un experto en relevancia de búsquedas para una plataforma de proveedores en Nicaragua.
Recibes una consulta del usuario y una lista de hasta 50 proveedores.
Tu tarea es puntuar cada proveedor de 0 a 100 según qué tan relevante es para la consulta.
- 100 = altamente relevante, coincide exactamente con lo que busca
- 50-99 = relevante con variaciones o categoría adyacente
- 1-49 = tangencialmente relacionado
- 0 = no relacionado o contrario a lo solicitado

Devuelve SOLO JSON válido con este formato:
{ "scores": { "providerId1": 85, "providerId2": 62, ... } }
No incluyas texto fuera del JSON. No uses bloques de código markdown.`;

export async function rankProviders(
  query: string,
  providers: RankableProvider[],
  signal?: AbortSignal
): Promise<RankingResult> {
  if (providers.length === 0) return { scores: {}, usedAi: false };

  if (providers.length > 50) {
    providers = [...providers]
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 50);
  }

  const providerList = providers
    .map(p => `[${p.id}] ${p.displayName} | ${p.category}${p.mainCategory ? " / " + p.mainCategory : ""}${p.shortDescription ? " | " + p.shortDescription.slice(0, 80) : ""}`)
    .join("\n");

  const prompt = `CONSULTA DEL USUARIO: "${query}"

LISTA DE PROVEEDORES:
${providerList}

Responde SOLO con el JSON de scores.`;

  try {
    const aiInstance = getAi();
    if (!aiInstance) throw new Error("AI client not initialized");

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeout = setTimeout(() => controller?.abort(), 5000);
    if (controller && signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await aiInstance.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT_RANK,
          temperature: 0.2,
        },
      });
      clearTimeout(timeout);

      const text = response.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}";
      const parsed = JSON.parse(text);

      if (parsed.scores && typeof parsed.scores === "object") {
        const scores: Record<string, number> = {};
        for (const p of providers) {
          const s = parsed.scores[p.id];
          scores[p.id] = typeof s === "number" && s >= 0 && s <= 100 ? s : keywordScore(query, p);
        }
        return { scores, usedAi: true };
      }

      return { scores: basicRankProviders(query, providers), usedAi: false };
    } finally {
      clearTimeout(timeout);
      controller?.abort();
    }
  } catch (error) {
    const c = classifyGeminiError(error);
    if (c.kind === "aborted") {
      console.warn("[rank-providers] Timeout, usando fallback keyword");
    } else if (c.kind === "rate_limit") {
      console.warn("[rank-providers] Rate limit (429) de Gemini, usando fallback", { retryAfterMs: c.retryAfterMs });
    } else if (c.kind === "unavailable") {
      console.info("[rank-providers] Gemini no disponible (503/5xx), degradando silenciosamente");
    } else {
      console.error("[rank-providers] Error inesperado de Gemini, usando fallback", error);
    }
    return { scores: basicRankProviders(query, providers), usedAi: false };
  }
}