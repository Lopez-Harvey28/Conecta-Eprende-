import { LegacyCity } from "@prisma/client";

export const cityToEnum: Record<string, LegacyCity> = {
  managua: LegacyCity.MANAGUA,
  leon: LegacyCity.LEON,
  "león": LegacyCity.LEON,
  granada: LegacyCity.GRANADA,
  masaya: LegacyCity.MASAYA,
  esteli: LegacyCity.ESTELI,
  "estelí": LegacyCity.ESTELI,
  matagalpa: LegacyCity.MATAGALPA,
  bluefields: LegacyCity.BLUEFIELDS,
  juigalpa: LegacyCity.JUIGALPA,
  nagarote: LegacyCity.NAGAROTE,
  "san juan de oriente": LegacyCity.SAN_JUAN_DE_ORIENTE,
};

export function normalizeCity(value: unknown): LegacyCity | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const raw = value.trim();
  const enumValue = cityToEnum[raw.toLowerCase()] ?? raw.toUpperCase().replace(/\s+/g, "_");
  return Object.values(LegacyCity).includes(enumValue as LegacyCity) ? (enumValue as LegacyCity) : undefined;
}

const LEGACY_CITY_DISPLAY: Record<LegacyCity, string> = {
  [LegacyCity.MANAGUA]: "Managua",
  [LegacyCity.LEON]: "León",
  [LegacyCity.GRANADA]: "Granada",
  [LegacyCity.MASAYA]: "Masaya",
  [LegacyCity.ESTELI]: "Estelí",
  [LegacyCity.MATAGALPA]: "Matagalpa",
  [LegacyCity.BLUEFIELDS]: "Bluefields",
  [LegacyCity.JUIGALPA]: "Juigalpa",
  [LegacyCity.NAGAROTE]: "Nagarote",
  [LegacyCity.SAN_JUAN_DE_ORIENTE]: "San Juan de Oriente",
};

export function legacyCityDisplayName(enumValue: LegacyCity): string {
  return LEGACY_CITY_DISPLAY[enumValue] ?? String(enumValue);
}

const CATEGORY_ALIASES: Record<string, string> = {
  "diseño": "Diseño Gráfico",
  "diseño gráfico": "Diseño Gráfico",
  "marketing": "Marketing Digital",
  "marketing digital": "Marketing Digital",
  "fotos": "Fotografía",
  "foto": "Fotografía",
  "fotografía": "Fotografía",
  "fotografo": "Fotografía",
  "plomería": "Plomería",
  "plomero": "Plomería",
  "carpintería": "Carpintería",
  "carpintero": "Carpintería",
  "electricidad": "Electricidad",
  "electricista": "Electricidad",
  "desarrollo web": "Desarrollo Web",
  "web developer": "Desarrollo Web",
  "programador": "Desarrollo Web",
  "limpieza": "Limpieza",
  "limpieza profesional": "Limpieza",
  "contabilidad": "Contabilidad",
  "contador": "Contabilidad",
  "abogado": "Abogado",
  "abogacía": "Abogado",
  "catering": "Catering",
  "banquetes": "Catering",
  "jardinería": "Jardinería",
  "jardinero": "Jardinería",
  "mecánica": "Mecánica",
  "mecánico": "Mecánica",
  "bordado": "Bordado y serigrafía",
  "serigrafía": "Bordado y serigrafía",
  "empaques": "Empaques ecológicos",
  "empaques ecológicos": "Empaques ecológicos",
  "café": "Café y alimentos",
  "alimentos": "Café y alimentos",
  "tecnológicos": "Servicios tecnológicos",
  "servicios tech": "Servicios tecnológicos",
  "agrícolas": "Insumos agrícolas",
  "insumos": "Insumos agrícolas",
  "muebles": "Muebles y carpintería",
  "mueblista": "Muebles y carpintería",
  "tech": "Servicios tecnológicos",
  "TI": "Servicios tecnológicos",
  "IT": "Servicios tecnológicos",
};

export function normalizeCategory(input: string | null): string | null {
  if (!input) return null;
  const cleaned = input.trim();
  const lower = cleaned.toLowerCase();
  if (CATEGORY_ALIASES[lower]) {
    return CATEGORY_ALIASES[lower];
  }
  const words = lower.split(/\s+/);
  for (let i = words.length; i > 0; i--) {
    const sub = words.slice(0, i).join(" ");
    if (CATEGORY_ALIASES[sub]) {
      return CATEGORY_ALIASES[sub];
    }
  }
  return cleaned;
}