import { z } from 'zod';

export const quoteDraftRequestSchema = z.object({
  idea: z.string().min(5, "La idea debe tener al menos 5 caracteres"),
  providerName: z.string().min(1, "El nombre del proveedor es obligatorio"),
});

export const quoteRequestSchema = z.object({
  providerId: z.string().min(1, "providerId es obligatorio"),
  subject: z.string().optional(),
  body: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
  // Optional catalog item the request is about (spec §10.3 / §20.3):
  // "Si el usuario pregunta por un producto específico, la solicitud debe
  //  guardar el catalog_item_id".
  catalogItemId: z.string().optional(),
});

export const searchProviderSchema = z.object({
  // `q` may arrive as a string OR as an array of strings if the client accidentally
  // appends the param twice (e.g. ?q=userquery&q=category). Coerce to a single string.
  q: z.union([z.string(), z.array(z.string())]).optional()
    .transform(v => Array.isArray(v) ? v[0] : v),
  city: z.union([z.string(), z.array(z.string())]).optional()
    .transform(v => Array.isArray(v) ? v[0] : v),
});

export const aiSearchProviderSchema = z.object({
  query: z.string().min(2, "La consulta debe tener al menos 2 caracteres"),
});

export const formalizationUpdateSchema = z.object({
  providerId: z.string(),
  stepId: z.string(),
  status: z.enum(["completed", "current", "pending", "informal"]),
});

export const enhanceBioSchema = z.object({
  bio: z.string().min(10, "La biografía debe tener al menos 10 caracteres"),
  category: z.string()
});
