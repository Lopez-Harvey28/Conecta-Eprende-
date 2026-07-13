import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAi() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. AI functions will fallback.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_PROMPT_INTENT = `Eres un extractor de intenciones para una plataforma nigeragüense de proveedores en Nicaragua.
Recibes una consulta en español y devuelves SOLO JSON válido con este esquema:
{
  "category": string | null,
  "city": string | null,
  "maxPriceNIO": number | null,
  "urgency": "alta" | "media" | "baja" | null,
  "keywords": string[]
}
No incluyas texto fuera del JSON. Devuelve formato JSON limpio sin bloques de código.`;

export interface SearchIntent {
  category: string | null;
  city: string | null;
  maxPriceNIO: number | null;
  urgency: "alta" | "media" | "baja" | null;
  keywords: string[];
}

const KNOWN_CITIES = [
  "Managua", "León", "Granada", "Masaya", "Estelí", "Matagalpa",
  "Bluefields", "Juigalpa", "Nagarote", "San Juan de Oriente"
];

const KNOWN_CATEGORIES = [
  "Diseño Gráfico", "Diseño", "Plomería", "Carpintería", "Electricidad",
  "Desarrollo Web", "Marketing", "Limpieza", "Contabilidad", "Abogado",
  "Fotografía", "Catering", "Jardinería", "Mecánica", "Bordado y serigrafía",
  "Empaques ecológicos", "Café y alimentos", "Servicios tecnológicos",
  "Insumos agrícolas", "Muebles y carpintería",
];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function basicExtractIntent(query: string): SearchIntent {
  const normalized = normalize(query);

  const city = KNOWN_CITIES.find(c => normalized.includes(normalize(c))) || null;

  const category = KNOWN_CATEGORIES.find(c => normalized.includes(normalize(c))) || null;

  const stopWords = new Set([
    "en", "de", "para", "por", "con", "y", "o", "el", "la", "los", "las",
    "un", "una", "unos", "unas", "mi", "mis", "necesito", "busco", "quiero",
    "que", "se", "me", "le", "lo", "te", "nos", "es", "está", "son", "están",
  ]);
  const matchedTokens = new Set([
    ...(city ? [normalize(city)] : []),
    ...(category ? normalize(category).split(" ") : []),
  ]);
  const keywords = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length > 2 && !stopWords.has(w) && ![...matchedTokens].some(t => normalized.includes(t)));

  const maxPriceNIO = /hasta\s*(\d+)/.test(query)
    ? parseInt(/hasta\s*(\d+)/.exec(query)![1], 10)
    : /menos\s*de\s*(\d+)/.test(query)
      ? parseInt(/menos\s*de\s*(\d+)/.exec(query)![1], 10)
      : null;

  const urgency = /(?:urgente|emergencia|ya|hoy|lo antes)/.test(normalized) ? "alta"
    : /(?:esta semana|pronto|rápido)/.test(normalized) ? "media"
      : null;

  return { category, city, maxPriceNIO, urgency, keywords };
}

export async function extractIntent(query: string): Promise<SearchIntent> {
  try {
    const aiInstance = getAi();
    if (!aiInstance) throw new Error("AI client not initialized");

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        { role: "user", parts: [{ text: "Query: " + query }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_INTENT,
        temperature: 0.1,
      }
    });

    const text = response.text;
    const cleanJson = text?.replace(/```json/g, "").replace(/```/g, "").trim() || "{}";
    const parsed = JSON.parse(cleanJson);

    return {
      category: parsed.category ?? null,
      city: parsed.city ?? null,
      maxPriceNIO: typeof parsed.maxPriceNIO === "number" ? parsed.maxPriceNIO : null,
      urgency: ["alta", "media", "baja"].includes(parsed.urgency) ? parsed.urgency : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean) : [],
    };
  } catch (error) {
    console.error("Failed to extract intent with Gemini, falling back to basic extraction", error);
    return basicExtractIntent(query);
  }
}