// src/lib/memory-db.ts
//
// In-memory data layer for the Provider Public Profile (spec: perfil_publico_proveedor_conecta_emprende_ai.md).
//
// NOTE on backward compatibility:
// The legacy runtime used a single `providers[]` array of loosely-typed objects.
// SearchPage, ProviderMap, ProfilePage and server.ts read fields like
// `displayName`, `bio`, `score`, `photos`, `reviews`, `category`, `city`,
// `lat`, `lng`, `availability`, `responseTimeHrs`, `verified` and `formalizationStatus`
// directly off each provider object. To avoid breaking those pages we keep those
// legacy fields as aliases alongside the new structured fields from the spec.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ItemType =
  | "PRODUCTO_FINAL"
  | "SERVICIO_ESPECIALIZADO"
  | "INSUMO"
  | "MATERIA_PRIMA"
  | "EQUIPO_PRODUCTIVO"
  | "ALQUILER_EQUIPO"
  | "REPARACION_MANTENIMIENTO"
  | "CAPACITACION";

export type AvailabilityValue =
  | "DISPONIBLE"
  | "OCUPADO"
  | "BAJO_PEDIDO"
  | "NO_DISPONIBLE_TEMPORALMENTE";

export type EquipmentModality =
  | "VENTA"
  | "ALQUILER"
  | "REPARACION"
  | "MANTENIMIENTO"
  | "INSTALACION"
  | "CAPACITACION_USO";

export type PhotoType =
  | "PRODUCTO"
  | "SERVICIO_REALIZADO"
  | "TALLER_O_LOCAL"
  | "EQUIPO_PRODUCTIVO"
  | "ENTREGA"
  | "PORTAFOLIO";

// MVP medal set (spec §16.3)
export type MedalType =
  | "PERFIL_COMPLETO"
  | "TELEFONO_VERIFICADO"
  | "RESPONDE_RAPIDO"
  | "BUENAS_RESENAS"
  | "SOLICITUDES_COMPLETADAS"
  | "EQUIPO_PRODUCTIVO_DISPONIBLE"
  | "EN_PROCESO_DE_FORMALIZACION";

export type FormalizationStatus =
  | "INFORMAL"
  | "EN_PROCESO"
  | "MIPYME_FORMAL"
  | "DOCUMENTOS_PENDIENTES";

export type DeliveryOption =
  | "RETIRO_EN_LOCAL"
  | "ENTREGA_LOCAL"
  | "ENTREGA_NACIONAL"
  | "SERVICIO_A_DOMICILIO"
  | "SERVICIO_DIGITAL";

export interface CatalogItem {
  id: string;
  providerId: string;
  title: string;
  itemType: ItemType;
  category: string;
  subcategory: string;
  description: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: string; // e.g. "NIO"
  priceUnit: string | null; // e.g. "unidad", "día", "proyecto"
  city: string;
  availabilityStatus: AvailabilityValue;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  mainImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentDetail {
  id: string;
  catalogItemId: string;
  modality: EquipmentModality;
  brand: string | null;
  model: string | null;
  condition: string | null;
  capacity: string | null;
  requiresTraining: boolean;
  includesInstallation: boolean;
  maintenanceAvailable: boolean;
}

export interface ProfilePhoto {
  id: string;
  providerId: string;
  catalogItemId: string | null;
  imageUrl: string;
  caption: string | null;
  photoType: PhotoType;
  isFeatured: boolean;
  createdAt: string;
}

export interface ProviderMedal {
  id: string;
  providerId: string;
  medalType: MedalType;
  earnedAt: string;
  sourceEvent: string;
}

export interface VerifiedReview {
  id: string;
  requestId: string; // verified-by-construction: every review links to a completed request
  reviewerId: string;
  reviewerName: string;
  reviewedProviderId: string;
  catalogItemId: string | null; // product/service the request was about (optional)
  qualityScore: number; // 1-5 per spec §17.2
  responseTimeScore: number;
  fulfillmentScore: number;
  communicationScore: number;
  valueScore: number;
  generalComment: string;
  createdAt: string; // ISO date
}

export interface Provider {
  id: string;
  userId: string;
  // Structured / commercial identity (spec §8.4 / §23.2)
  businessName: string;
  slug: string;
  city: string;
  department: string | null;
  mainCategory: string;
  shortDescription: string;
  aboutDescription: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  availabilityStatus: AvailabilityValue;
  priceRange: string | null;
  businessHours: string | null;
  serviceRadius: string | null;
  deliveryOptions: DeliveryOption[];
  formalizationStatus: FormalizationStatus;
  verificationLevel: string; // e.g. "Perfil completo", "Teléfono verificado", "Documento verificado"
  trustScore: number; // 0-100, platform-calculated (spec §9)
  responseTimeHrs: number;
  completedRequests: number;
  createdAt: string;
  updatedAt: string;

  // --- Legacy aliases (kept for SearchPage / ProviderMap / ProfilePage) ---
  displayName: string;
  bio: string;
  category: string;
  score: number;
  lat: number;
  lng: number;
  availability: AvailabilityValue;
  verified: boolean;
  photos: string[];
  // Legacy embedded reviews (kept for ProfilePage stats / map popup average).
  // The full structured reviews live in the standalone `reviews[]` collection.
  reviews: { id: string; author: string; rating: number; text: string; date: string }[];
}

export interface QuoteThread {
  id: string;
  providerId: string;
  catalogItemId: string | null; // optional product the request is about (spec §20.3)
  subject: string;
  clientName: string;
  clientAvatar: string;
  status: string;
  date: string;
  messages: { id: string; author: string; text: string; time: string }[];
}

// ---------------------------------------------------------------------------
// Constants / enums surfaced for the UI (spec §11.2, §15.3, §15.4, §12.3, §16.3)
// ---------------------------------------------------------------------------

export const ITEM_TYPES: ItemType[] = [
  "PRODUCTO_FINAL",
  "SERVICIO_ESPECIALIZADO",
  "INSUMO",
  "MATERIA_PRIMA",
  "EQUIPO_PRODUCTIVO",
  "ALQUILER_EQUIPO",
  "REPARACION_MANTENIMIENTO",
  "CAPACITACION",
];

export const AVAILABILITY_VALUES: AvailabilityValue[] = [
  "DISPONIBLE",
  "OCUPADO",
  "BAJO_PEDIDO",
  "NO_DISPONIBLE_TEMPORALMENTE",
];

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  "RETIRO_EN_LOCAL",
  "ENTREGA_LOCAL",
  "ENTREGA_NACIONAL",
  "SERVICIO_A_DOMICILIO",
  "SERVICIO_DIGITAL",
];

export const EQUIPMENT_MODALITIES: EquipmentModality[] = [
  "VENTA",
  "ALQUILER",
  "REPARACION",
  "MANTENIMIENTO",
  "INSTALACION",
  "CAPACITACION_USO",
];

export const MVP_MEDALS: MedalType[] = [
  "PERFIL_COMPLETO",
  "TELEFONO_VERIFICADO",
  "RESPONDE_RAPIDO",
  "BUENAS_RESENAS",
  "SOLICITUDES_COMPLETADAS",
  "EQUIPO_PRODUCTIVO_DISPONIBLE",
  "EN_PROCESO_DE_FORMALIZACION",
];

// Human-friendly labels (Spanish) for each catalog item type.
export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  PRODUCTO_FINAL: "Producto final",
  SERVICIO_ESPECIALIZADO: "Servicio especializado",
  INSUMO: "Insumo",
  MATERIA_PRIMA: "Materia prima",
  EQUIPO_PRODUCTIVO: "Equipo productivo",
  ALQUILER_EQUIPO: "Alquiler de equipo",
  REPARACION_MANTENIMIENTO: "Reparación / Mantenimiento",
  CAPACITACION: "Capacitación",
};

export const AVAILABILITY_LABELS: Record<AvailabilityValue, string> = {
  DISPONIBLE: "Disponible",
  OCUPADO: "Ocupado",
  BAJO_PEDIDO: "Bajo pedido",
  NO_DISPONIBLE_TEMPORALMENTE: "No disponible temporalmente",
};

export const DELIVERY_LABELS: Record<DeliveryOption, string> = {
  RETIRO_EN_LOCAL: "Retiro en local",
  ENTREGA_LOCAL: "Entrega local",
  ENTREGA_NACIONAL: "Entrega nacional",
  SERVICIO_A_DOMICILIO: "Servicio a domicilio",
  SERVICIO_DIGITAL: "Servicio digital",
};

export const MODALITY_LABELS: Record<EquipmentModality, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  REPARACION: "Reparación",
  MANTENIMIENTO: "Mantenimiento",
  INSTALACION: "Instalación",
  CAPACITACION_USO: "Capacitación de uso",
};

// Medal metadata for UI rendering: label + the earning rule (spec §16.6) +
// a Lucide icon name the page can map. Medals are NEVER editable by the
// provider (spec §16.2) — these descriptions explain how they are earned.
export const MEDAL_META: Record<
  MedalType,
  { label: string; description: string; icon: string; tone: string }
> = {
  PERFIL_COMPLETO: {
    label: "Perfil completo",
    description:
      "Se gana al completar nombre, ciudad, categoría, descripción, al menos 1 producto/servicio y 1 foto.",
    icon: "CheckCircle",
    tone: "blue",
  },
  TELEFONO_VERIFICADO: {
    label: "Teléfono verificado",
    description: "Se gana al verificar el número de teléfono del negocio.",
    icon: "Phone",
    tone: "green",
  },
  RESPONDE_RAPIDO: {
    label: "Responde rápido",
    description:
      "Se gana con tiempo promedio de respuesta menor a 6 horas tras al menos 5 solicitudes.",
    icon: "Zap",
    tone: "amber",
  },
  BUENAS_RESENAS: {
    label: "Buenas reseñas",
    description:
      "Se gana con promedio de reseñas verificadas ≥ 4.5 tras al menos 5 reseñas.",
    icon: "Star",
    tone: "yellow",
  },
  SOLICITUDES_COMPLETADAS: {
    label: "Solicitudes completadas",
    description:
      "Se gana con al menos 5 solicitudes completadas con confirmación bilateral.",
    icon: "Award",
    tone: "purple",
  },
  EQUIPO_PRODUCTIVO_DISPONIBLE: {
    label: "Equipo productivo disponible",
    description:
      "Se gana al agregar al menos un equipo productivo o alquiler de equipo al catálogo.",
    icon: "Wrench",
    tone: "slate",
  },
  EN_PROCESO_DE_FORMALIZACION: {
    label: "En proceso de formalización",
    description: "Se gana al avanzar en el checklist de formalización.",
    icon: "ShieldCheck",
    tone: "indigo",
  },
};

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString();

export const providers: Provider[] = [
  {
    id: "1",
    userId: "u1",
    businessName: "Estudio Creativo Managua",
    slug: "estudio-creativo-managua",
    city: "Managua",
    department: "Managua",
    mainCategory: "Diseño Gráfico",
    shortDescription: "Branding, diseño de interfaces y marketing digital para pymes.",
    aboutDescription:
      "Somos un estudio especializado en branding, diseño de interfaces y marketing digital para pymes en Nicaragua. Llevamos más de 5 años transformando marcas locales en referentes regionales.",
    logoUrl: null,
    coverImageUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    availabilityStatus: "DISPONIBLE",
    priceRange: "C$1,500 – C$10,000",
    businessHours: "Lun–Vie, 9:00–18:00",
    serviceRadius: "Nacional (servicio digital)",
    deliveryOptions: ["SERVICIO_DIGITAL", "ENTREGA_NACIONAL"],
    formalizationStatus: "MIPYME_FORMAL",
    verificationLevel: "MIPYME formal",
    trustScore: 92,
    responseTimeHrs: 2.5,
    completedRequests: 24,
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: now(),
    // Legacy aliases
    displayName: "Estudio Creativo Managua",
    bio: "Somos un estudio especializado en branding, diseño de interfaces y marketing digital para pymes en Nicaragua. Llevamos más de 5 años transformando marcas locales en referentes regionales.",
    category: "Diseño Gráfico",
    score: 92,
    lat: 12.1328,
    lng: -86.2504,
    availability: "DISPONIBLE",
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542744094-24638ea0bbac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    reviews: [
      { id: "r1", author: "Juan P.", rating: 5, text: "Excelente trabajo con el logo de mi restaurante.", date: "Hace 2 semanas" },
      { id: "r2", author: "María C.", rating: 4, text: "Muy profesionales.", date: "Hace 1 mes" },
    ],
  },
  {
    id: "2",
    userId: "u2",
    businessName: "Plomería El Rápido",
    slug: "plomeria-el-rapido",
    city: "León",
    department: "León",
    mainCategory: "Plomería",
    shortDescription: "Servicio de plomería urgente: fugas, destape de tuberías y reparaciones.",
    aboutDescription:
      "Servicio de plomería urgente. Atendemos fugas, destape de tuberías, instalación de sanitarios y mantenimiento de sistemas de agua en hogares y comercios de León.",
    logoUrl: null,
    coverImageUrl: null,
    availabilityStatus: "OCUPADO",
    priceRange: "C$500 – C$3,000",
    businessHours: "Lun–Sáb, 8:00–20:00 (urgencias 24h)",
    serviceRadius: "25 km alrededor de León",
    deliveryOptions: ["SERVICIO_A_DOMICILIO"],
    formalizationStatus: "INFORMAL",
    verificationLevel: "Perfil básico",
    trustScore: 85,
    responseTimeHrs: 1,
    completedRequests: 11,
    createdAt: "2025-03-22T08:00:00.000Z",
    updatedAt: now(),
    displayName: "Plomería El Rápido",
    bio: "Servicio de plomería urgente. Atendemos fugas, destape de tuberías y más.",
    category: "Plomería",
    score: 85,
    lat: 12.4346,
    lng: -86.8796,
    availability: "OCUPADO",
    verified: false,
    photos: [],
    reviews: [],
  },
  {
    id: "3",
    userId: "u3",
    businessName: "Muebles Artesanales",
    slug: "muebles-artesanales",
    city: "Granada",
    department: "Granada",
    mainCategory: "Carpintería",
    shortDescription: "Fabricación de muebles finos de madera con diseños a la medida.",
    aboutDescription:
      "Fabricación de muebles finos de madera. Diseños a la medida, restauración de muebles y carpintería en general. Cada pieza se construye de forma artesanal.",
    logoUrl: null,
    coverImageUrl: null,
    availabilityStatus: "DISPONIBLE",
    priceRange: "C$2,000 – C$25,000",
    businessHours: "Lun–Vie, 8:00–17:00",
    serviceRadius: "Granada y alrededores",
    deliveryOptions: ["RETIRO_EN_LOCAL", "ENTREGA_LOCAL"],
    formalizationStatus: "MIPYME_FORMAL",
    verificationLevel: "MIPYME formal",
    trustScore: 96,
    responseTimeHrs: 48,
    completedRequests: 8,
    createdAt: "2024-11-05T08:00:00.000Z",
    updatedAt: now(),
    displayName: "Muebles Artesanales",
    bio: "Fabricación de muebles finos de madera. Diseños a la medida.",
    category: "Carpintería",
    score: 96,
    lat: 11.9344,
    lng: -85.956,
    availability: "DISPONIBLE",
    verified: true,
    photos: [],
    reviews: [],
  },
  // 4th provider = spec §27 example seed. Demonstrates catalog with a
  // PRODUCTO_FINAL and an EQUIPO_PRODUCTIVO + ALQUILER_EQUIPO so the
  // spec's example query "alquilar máquina de coser industrial en Masaya"
  // returns a real result.
  {
    id: "4",
    userId: "u4",
    businessName: "Taller Creativo Masaya",
    slug: "taller-creativo-masaya",
    city: "Masaya",
    department: "Masaya",
    mainCategory: "Textil y personalización",
    shortDescription: "Bordado, camisetas personalizadas y uniformes para pequeños negocios.",
    aboutDescription:
      "Somos un taller familiar de Masaya especializado en bordado, uniformes y personalización de camisetas para pequeños negocios, escuelas y eventos.",
    logoUrl: null,
    coverImageUrl:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    availabilityStatus: "DISPONIBLE",
    priceRange: "C$250 – C$3,000",
    businessHours: "Lun–Sáb, 9:00–19:00",
    serviceRadius: "Masaya, Granada y Managua",
    deliveryOptions: ["RETIRO_EN_LOCAL", "ENTREGA_LOCAL", "ENTREGA_NACIONAL"],
    formalizationStatus: "EN_PROCESO",
    verificationLevel: "Perfil completo",
    trustScore: 86,
    responseTimeHrs: 2,
    completedRequests: 18,
    createdAt: "2025-02-14T08:00:00.000Z",
    updatedAt: now(),
    displayName: "Taller Creativo Masaya",
    bio: "Bordado, camisetas personalizadas y uniformes para pequeños negocios.",
    category: "Textil y personalización",
    score: 86,
    lat: 11.9744,
    lng: -86.0944,
    availability: "DISPONIBLE",
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    reviews: [
      { id: "r3", author: "María G.", rating: 5, text: "El pedido fue entregado a tiempo y la comunicación fue clara.", date: "Hace 3 días" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Catalog items (spec §11.3)
// ---------------------------------------------------------------------------

export const catalogItems: CatalogItem[] = [
  // --- Provider 1: Estudio Creativo Managua ---
  {
    id: "c1", providerId: "1", title: "Diseño de logotipo",
    itemType: "SERVICIO_ESPECIALIZADO", category: "Diseño Gráfico", subcategory: "Branding",
    description: "Diseño de logotipo profesional con manual de marca básico y entregables digitales.",
    priceMin: 1500, priceMax: 3000, currency: "NIO", priceUnit: "proyecto",
    city: "Managua", availabilityStatus: "DISPONIBLE",
    deliveryAvailable: true, pickupAvailable: false,
    mainImageUrl: "https://images.unsplash.com/photo-1542744094-24638ea0bbac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    createdAt: "2025-01-12T08:00:00.000Z", updatedAt: now(),
  },
  {
    id: "c2", providerId: "1", title: "Gestión de redes sociales",
    itemType: "SERVICIO_ESPECIALIZADO", category: "Marketing", subcategory: "Redes sociales",
    description: "Planificación y diseño de contenido mensual para Instagram y Facebook.",
    priceMin: 3000, priceMax: 8000, currency: "NIO", priceUnit: "mes",
    city: "Managua", availabilityStatus: "DISPONIBLE",
    deliveryAvailable: true, pickupAvailable: false,
    mainImageUrl: null,
    createdAt: "2025-02-01T08:00:00.000Z", updatedAt: now(),
  },
  // --- Provider 2: Plomería El Rápido ---
  {
    id: "c3", providerId: "2", title: "Reparación de fugas de agua",
    itemType: "SERVICIO_ESPECIALIZADO", category: "Plomería", subcategory: "Urgencias",
    description: "Detección y reparación de fugas en tuberías de agua potable.",
    priceMin: 500, priceMax: 2000, currency: "NIO", priceUnit: "servicio",
    city: "León", availabilityStatus: "BAJO_PEDIDO",
    deliveryAvailable: false, pickupAvailable: false,
    mainImageUrl: null,
    createdAt: "2025-03-25T08:00:00.000Z", updatedAt: now(),
  },
  // --- Provider 3: Muebles Artesanales ---
  {
    id: "c4", providerId: "3", title: "Mesa de comedor de madera",
    itemType: "PRODUCTO_FINAL", category: "Carpintería", subcategory: "Muebles",
    description: "Mesa de comedor para 6 personas fabricada en madera maciza.",
    priceMin: 8000, priceMax: 25000, currency: "NIO", priceUnit: "unidad",
    city: "Granada", availabilityStatus: "DISPONIBLE",
    deliveryAvailable: true, pickupAvailable: true,
    mainImageUrl: null,
    createdAt: "2024-11-10T08:00:00.000Z", updatedAt: now(),
  },
  // --- Provider 4: Taller Creativo Masaya (spec §27) ---
  {
    id: "c5", providerId: "4", title: "Camisetas personalizadas",
    itemType: "PRODUCTO_FINAL", category: "Textil", subcategory: "Ropa personalizada",
    description: "Camisetas personalizadas con bordado o serigrafía para negocios, escuelas y eventos.",
    priceMin: 250, priceMax: 400, currency: "NIO", priceUnit: "unidad",
    city: "Masaya", availabilityStatus: "DISPONIBLE",
    deliveryAvailable: true, pickupAvailable: true,
    mainImageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    createdAt: "2025-02-15T08:00:00.000Z", updatedAt: now(),
  },
  {
    id: "c6", providerId: "4", title: "Máquina de coser industrial",
    itemType: "EQUIPO_PRODUCTIVO", category: "Equipos productivos", subcategory: "Máquinas de coser",
    description: "Máquina de coser industrial recta, ideal para producción de prendas a escala.",
    priceMin: 700, priceMax: 700, currency: "NIO", priceUnit: "día",
    city: "Masaya", availabilityStatus: "DISPONIBLE",
    deliveryAvailable: false, pickupAvailable: true,
    mainImageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    createdAt: "2025-02-16T08:00:00.000Z", updatedAt: now(),
  },
];

// ---------------------------------------------------------------------------
// Equipment details (spec §12.4) — joined 1:1 to catalog items
// ---------------------------------------------------------------------------

export const equipmentDetails: EquipmentDetail[] = [
  {
    id: "e1", catalogItemId: "c6", modality: "ALQUILER",
    brand: "Juki", model: "DDL-8700", condition: "Buen estado",
    capacity: "Costura recta industrial, 5,000 ppm",
    requiresTraining: true, includesInstallation: false, maintenanceAvailable: true,
  },
];

// ---------------------------------------------------------------------------
// Profile photos (spec §13.3)
// ---------------------------------------------------------------------------

export const profilePhotos: ProfilePhoto[] = [
  // Provider 1
  { id: "p1", providerId: "1", catalogItemId: null, imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "Nuestro estudio", photoType: "TALLER_O_LOCAL", isFeatured: true, createdAt: now() },
  { id: "p2", providerId: "1", catalogItemId: "c1", imageUrl: "https://images.unsplash.com/photo-1542744094-24638ea0bbac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "Proyecto de branding", photoType: "PORTAFOLIO", isFeatured: false, createdAt: now() },
  // Provider 4
  { id: "p3", providerId: "4", catalogItemId: null, imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "Taller de bordado", photoType: "TALLER_O_LOCAL", isFeatured: true, createdAt: now() },
  { id: "p4", providerId: "4", catalogItemId: "c5", imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "Camisetas personalizadas", photoType: "PRODUCTO", isFeatured: false, createdAt: now() },
];

// ---------------------------------------------------------------------------
// Provider medals (spec §16.5) — earned by behaviour, never manual (§16.2)
// ---------------------------------------------------------------------------

export const providerMedals: ProviderMedal[] = [
  // Provider 1
  { id: "m1", providerId: "1", medalType: "PERFIL_COMPLETO", earnedAt: "2025-01-12T08:00:00.000Z", sourceEvent: "Completó todos los campos del perfil" },
  { id: "m2", providerId: "1", medalType: "RESPONDE_RAPIDO", earnedAt: "2025-02-01T08:00:00.000Z", sourceEvent: "Tiempo promedio de respuesta < 6h tras 5+ solicitudes" },
  { id: "m3", providerId: "1", medalType: "BUENAS_RESENAS", earnedAt: "2025-03-01T08:00:00.000Z", sourceEvent: "Promedio de reseñas verificadas ≥ 4.5" },
  { id: "m4", providerId: "1", medalType: "SOLICITUDES_COMPLETADAS", earnedAt: "2025-04-01T08:00:00.000Z", sourceEvent: "5+ solicitudes completadas con confirmación bilateral" },
  // Provider 3
  { id: "m5", providerId: "3", medalType: "PERFIL_COMPLETO", earnedAt: "2024-11-10T08:00:00.000Z", sourceEvent: "Completó todos los campos del perfil" },
  { id: "m6", providerId: "3", medalType: "TELEFONO_VERIFICADO", earnedAt: "2024-11-15T08:00:00.000Z", sourceEvent: "Verificó su número de teléfono" },
  // Provider 4 (spec §27 example)
  { id: "m7", providerId: "4", medalType: "PERFIL_COMPLETO", earnedAt: "2025-02-15T08:00:00.000Z", sourceEvent: "Completó todos los campos del perfil" },
  { id: "m8", providerId: "4", medalType: "RESPONDE_RAPIDO", earnedAt: "2025-03-01T08:00:00.000Z", sourceEvent: "Tiempo promedio de respuesta < 6h tras 5+ solicitudes" },
  { id: "m9", providerId: "4", medalType: "BUENAS_RESENAS", earnedAt: "2025-03-10T08:00:00.000Z", sourceEvent: "Promedio de reseñas verificadas ≥ 4.5" },
  { id: "m10", providerId: "4", medalType: "EQUIPO_PRODUCTIVO_DISPONIBLE", earnedAt: "2025-02-16T08:00:00.000Z", sourceEvent: "Agregó un equipo productivo al catálogo" },
  { id: "m11", providerId: "4", medalType: "EN_PROCESO_DE_FORMALIZACION", earnedAt: "2025-02-20T08:00:00.000Z", sourceEvent: "Avanzó en el checklist de formalización" },
];

// ---------------------------------------------------------------------------
// Verified reviews (spec §17.3 / §18) — every review links to a requestId
// ---------------------------------------------------------------------------

export const reviews: VerifiedReview[] = [
  // Provider 1
  {
    id: "rv1", requestId: "t2", reviewerId: "u5", reviewerName: "María C.",
    reviewedProviderId: "1", catalogItemId: "c1",
    qualityScore: 5, responseTimeScore: 4, fulfillmentScore: 5, communicationScore: 4, valueScore: 4,
    generalComment: "Muy profesionales. Entregaron el logo a tiempo y con gran calidad.",
    createdAt: "2025-05-01T10:00:00.000Z",
  },
  {
    id: "rv2", requestId: "t3", reviewerId: "u6", reviewerName: "Juan P.",
    reviewedProviderId: "1", catalogItemId: "c1",
    qualityScore: 5, responseTimeScore: 5, fulfillmentScore: 5, communicationScore: 5, valueScore: 4,
    generalComment: "Excelente trabajo con el logo de mi restaurante.",
    createdAt: "2025-05-15T10:00:00.000Z",
  },
  // Provider 4
  {
    id: "rv3", requestId: "t4", reviewerId: "u7", reviewerName: "María G.",
    reviewedProviderId: "4", catalogItemId: "c5",
    qualityScore: 5, responseTimeScore: 5, fulfillmentScore: 5, communicationScore: 5, valueScore: 5,
    generalComment: "El pedido fue entregado a tiempo y la comunicación fue clara.",
    createdAt: "2025-06-25T10:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Quote threads (kept in-memory; legacy shape preserved)
// ---------------------------------------------------------------------------

export const quotes: QuoteThread[] = [
  {
    id: "t1", providerId: "1", catalogItemId: null,
    subject: "Diseño de Menú para Restaurante", clientName: "Hotel Estrella", clientAvatar: "HE",
    status: "OPEN", date: "Ayer",
    messages: [
      { id: "m1", author: "client", text: "Hola, necesito el diseño de un menú de 4 páginas. Queremos algo moderno, similar a nuestro branding actual.", time: "10:00 AM" },
      { id: "m2", author: "provider", text: "¡Claro! El costo aproximado es de 3000 NIO. Te puedo preparar un par de bocetos iniciales sin compromiso para que veas la línea gráfica.", time: "11:30 AM" },
      { id: "m3", author: "client", text: "Me parece perfecto. ¿Para cuándo los tendrías?", time: "1:00 PM" },
    ],
  },
  {
    id: "t2", providerId: "1", catalogItemId: "c1",
    subject: "Diseño de Logotipo", clientName: "Café Verde", clientAvatar: "CV",
    status: "CLOSED", date: "Hace 1 semana",
    messages: [
      { id: "m4", author: "client", text: "Quisiéramos un logo nuevo para la cafetería.", time: "09:00 AM" },
      { id: "m5", author: "provider", text: "Con gusto. Incluye 3 propuestas y manual básico.", time: "10:00 AM" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Formalization checklists (legacy shape kept for FormalizationPage / ProfilePage)
// ---------------------------------------------------------------------------

export const formalizations: Record<string, any[]> = {
  "1": [
    { id: "mific", title: "Registro en MIFIC", description: "Inscripción en el Ministerio de Fomento, Industria y Comercio. Protege tu marca comercial.", status: "completed" },
    { id: "dgi", title: "Inscripción DGI (RUC)", description: "Obtención del Registro Único del Contribuyente para operar formalmente.", status: "current" },
    { id: "alcaldia", title: "Matrícula de Alcaldía", description: "Inscripción en la municipalidad local para tu licencia de operaciones.", status: "pending" },
    { id: "inss", title: "Registro Patronal INSS", description: "Apertura de registro para beneficios de seguridad social de empleados.", status: "pending" },
  ],
  "4": [
    { id: "info", title: "Completar información del negocio", description: "Nombre comercial, ciudad y categoría principales.", status: "completed" },
    { id: "catalog", title: "Agregar productos o servicios", description: "Publica al menos un producto o servicio en el catálogo.", status: "completed" },
    { id: "phone", title: "Agregar teléfono verificado", description: "Verifica tu número de contacto.", status: "completed" },
    { id: "req", title: "Revisar requisitos de formalización", description: "Conoce los pasos para formalizar tu MIPYME.", status: "current" },
    { id: "docs", title: "Preparar documentos básicos", description: "Reúne identificación y comprobante de domicilio.", status: "pending" },
    { id: "mific", title: "Inscripción MIFIC", description: "Inscripción en el Ministerio de Fomento, Industria y Comercio.", status: "pending" },
  ],
};

export function updateFormalizationStep(providerId: string, stepId: string, status: string) {
  if (!formalizations[providerId]) return false;

  const rules = formalizations[providerId];
  let nextCurrentIndex = -1;
  let didUpdate = false;

  for (let i = 0; i < rules.length; i++) {
    if (rules[i].id === stepId) {
      rules[i].status = status;
      didUpdate = true;
      if (status === 'completed') {
        nextCurrentIndex = i + 1;
      }
    }
  }

  // Auto advance next pending step to current
  if (nextCurrentIndex !== -1 && nextCurrentIndex < rules.length) {
    if (rules[nextCurrentIndex].status === 'pending') {
      rules[nextCurrentIndex].status = 'current';
    }
  }

  return didUpdate;
}

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

/** Resolve a provider by id OR slug (spec §26.1 wants /providers/:slug). */
export function getProviderBySlugOrId(idOrSlug: string): Provider | undefined {
  return providers.find(
    p => p.id === idOrSlug || p.slug === idOrSlug
  );
}

/** Average of all 5 category scores for a single review (spec §17). */
function reviewGeneralScore(r: VerifiedReview): number {
  return (
    r.qualityScore +
    r.responseTimeScore +
    r.fulfillmentScore +
    r.communicationScore +
    r.valueScore
  ) / 5;
}

export interface AggregateReview extends VerifiedReview {
  generalScore: number; // computed average of the 5 category scores
}

export interface FullProvider {
  provider: Provider;
  catalogItems: (CatalogItem & { equipment?: EquipmentDetail })[];
  photos: ProfilePhoto[];
  medals: ProviderMedal[];
  reviews: AggregateReview[];
  averageReviewScore: number | null; // null when there are no verified reviews
  completedRequestsCount: number;
}

/**
 * Returns the full structured public profile payload (spec §4 / §7):
 * provider + catalog (with equipment join) + photos + medals + verified reviews
 * + computed average review score. This is what GET /api/providers/:id serves.
 */
export function getFullProvider(idOrSlug: string): FullProvider | null {
  const provider = getProviderBySlugOrId(idOrSlug);
  if (!provider) return null;

  const items = catalogItems.filter(c => c.providerId === provider.id);
  const itemsWithEquipment = items.map(c => ({
    ...c,
    equipment: equipmentDetails.find(e => e.catalogItemId === c.id) || undefined,
  }));

  const providerReviews = reviews
    .filter(r => r.reviewedProviderId === provider.id)
    .map(r => ({ ...r, generalScore: reviewGeneralScore(r) }));

  const avg =
    providerReviews.length > 0
      ? Math.round(
          (providerReviews.reduce((s, r) => s + r.generalScore, 0) /
            providerReviews.length) *
            10
        ) / 10
      : null;

  return {
    provider,
    catalogItems: itemsWithEquipment,
    photos: profilePhotos.filter(p => p.providerId === provider.id),
    medals: providerMedals.filter(m => m.providerId === provider.id),
    reviews: providerReviews,
    averageReviewScore: avg,
    completedRequestsCount: provider.completedRequests,
  };
}
