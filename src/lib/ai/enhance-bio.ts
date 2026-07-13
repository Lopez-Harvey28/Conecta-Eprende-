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

const SYSTEM_PROMPT = `Eres un experto en marketing y redacción de perfiles profesionales.
Tu tarea es tomar una biografía corta o informal de un proveedor de servicios (ej. plomero, diseñador, abogado) en Nicaragua, y reescribirla para que suene profesional, persuasiva y orientada a conseguir clientes.
Mantén la longitud en un párrafo conciso (máximo 300 caracteres o 3-4 oraciones breves).
No agregues información falsa o habilidades no mencionadas, simplemente mejora la redacción del texto original, resaltando la categoría del proveedor.

Devuelve SOLO la nueva biografía (sin preámbulos, comillas ni explicaciones).`;

export async function generateEnhancedBio(bio: string, category: string) {
  try {
    const aiInstance = getAi();
    if (!aiInstance) throw new Error("AI client not initialized");

    const prompt = `Categoría del negocio: ${category}\nBiografía actual (para mejorar): ${bio}`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    return response.text?.trim() || bio;
  } catch (error) {
    console.error("Gemini Error en enhance-bio:", error);
    // Fallback if API fails or is not connected
    return `Somos profesionales con experiencia demostrada en ${category}. ${bio} Siempre nos enfocamos en brindar el mejor servicio a nuestros clientes con los más altos estándares de calidad.`;
  }
}
