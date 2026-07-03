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

const SYSTEM_PROMPT_INTENT = `Eres un extractor de intenciones para una plataforma nicaragüense.
Recibes una consulta en español y devuelves SOLO JSON válido con este esquema:
{
  "category": string | null,         // ej: "Diseño Gráfico", "Plomería", "Carpintería"
  "city": string | null,             // una de: Managua, León, Granada, Masaya, Estelí, Matagalpa, Bluefields, Juigalpa, Nagarote, San Juan de Oriente
  "maxPriceNIO": number | null,
  "urgency": "alta" | "media" | "baja" | null,
  "keywords": string[]
}
No incluyas texto fuera del JSON. Devuelve formato JSON limpio sin bloques de código.`;

// Known cities and categories used by the keyword-based fallback when the LLM is unavailable.
const KNOWN_CITIES = [
  "Managua", "León", "Granada", "Masaya", "Estelí", "Matagalpa",
  "Bluefields", "Juigalpa", "Nagarote", "San Juan de Oriente"
];

const KNOWN_CATEGORIES = [
  "Diseño Gráfico", "Diseño", "Plomería", "Carpintería", "Electricidad",
  "Desarrollo Web", "Marketing", "Limpieza", "Contabilidad", "Abogado",
  "Fotografía", "Catering", "Jardinería", "Mecánica"
];

/**
 * Lightweight keyword-based intent extraction used as a fallback when the Gemini
 * API key is missing or the request fails. Detects known Nicaraguan cities and
 * common service categories so users still get useful results without AI.
 */
function basicExtractIntent(query: string) {
  const normalized = query.toLowerCase();

  // Detect city (case-insensitive, with accents tolerated)
  const city = KNOWN_CITIES.find(c =>
    normalized.includes(c.toLowerCase())
  ) || null;

  // Detect category by checking each known category against the query
  const category = KNOWN_CATEGORIES.find(c =>
    normalized.includes(c.toLowerCase())
  ) || null;

  // Build keywords excluding Spanish stop-words and the matched city/category tokens
  const stopWords = new Set([
    "en", "de", "para", "por", "con", "y", "o", "el", "la", "los", "las",
    "un", "una", "unos", "unas", "mi", "mis", "necesito", "busco", "quiero"
  ]);
  const matchedTokens = new Set(
    [...(city ? [city.toLowerCase()] : []), ...(category ? category.toLowerCase().split(" ") : [])]
  );
  const keywords = normalized
    .split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length > 1 && !stopWords.has(w) && !matchedTokens.has(w));

  return { category, city, keywords };
}

export async function extractIntent(query: string) {
  try {
    const aiInstance = getAi();
    if (!aiInstance) throw new Error("AI client not initialized");

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: "Query: " + query }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_INTENT,
        temperature: 0.1,
      }
    });

    const text = response.text;
    // Strip markdown JSON wrapping if present
    const cleanJson = text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Failed to extract intent with Gemini, falling back to basic extraction", error);
    // Basic fallback parsing — still tries to detect known cities and categories.
    return basicExtractIntent(query);
  }
}
