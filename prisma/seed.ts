import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  Availability,
  City,
  FormalizationStatus,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "Conecta123!";
const now = new Date("2026-07-07T12:00:00.000Z");

const users = [
  { id: "seed_user_requester", email: "requester@conecta.test", name: "Andrea Requester", role: Role.USER },
  { id: "seed_user_provider_textil", email: "textil@conecta.test", name: "María Textil", role: Role.PROVIDER },
  { id: "seed_user_provider_empaques", email: "empaques@conecta.test", name: "Carlos Empaques", role: Role.PROVIDER },
  { id: "seed_user_provider_tech", email: "tech@conecta.test", name: "Lucía Tech", role: Role.PROVIDER },
  { id: "seed_user_provider_cafe", email: "cafe@conecta.test", name: "Don Ernesto Café", role: Role.PROVIDER },
  { id: "seed_user_provider_equipo", email: "equipos@conecta.test", name: "Rosa Equipos", role: Role.PROVIDER },
  { id: "seed_user_provider_marketing", email: "marketing@conecta.test", name: "Mateo Marketing", role: Role.PROVIDER },
  { id: "seed_user_admin", email: "admin@conecta.test", name: "Admin Reviewer", role: Role.ADMIN },
  { id: "seed_user_superadmin", email: "superadmin@conecta.test", name: "Super Admin", role: Role.ADMIN },
] as const;

const providerSeeds = [
  {
    id: "seed_provider_textil",
    userId: "seed_user_provider_textil",
    displayName: "Taller Creativo Masaya",
    slug: "taller-creativo-masaya",
    city: City.MASAYA,
    category: "Bordado y serigrafía",
    mainCategory: "Textil personalizado",
    shortDescription: "Bordado, camisetas y uniformes para pequeños negocios.",
    aboutDescription: "Taller local especializado en bordado, camisetas personalizadas y uniformes para emprendimientos, colegios y equipos de trabajo.",
    priceRange: "MEDIUM",
    availability: Availability.DISPONIBLE,
    formalizationStatus: FormalizationStatus.EN_PROCESO,
    verified: true,
    verificationLevel: "COMPLETE",
    completedRequests: 18,
    responseTimeHrs: 2,
    lat: 11.9744,
    lng: -86.0944,
    trust: 88,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    medals: ["PERFIL_COMPLETO", "TELEFONO_VERIFICADO", "RESPONDE_RAPIDO", "BUENAS_RESENAS"],
    catalog: [
      { id: "seed_item_textil_camisetas", title: "Camisetas personalizadas", itemType: "PRODUCTO_FINAL", subcategory: "Camisetas", priceMin: 250, priceMax: 400, priceUnit: "unidad" },
      { id: "seed_item_textil_uniformes", title: "Uniformes bordados", itemType: "SERVICIO_ESPECIALIZADO", subcategory: "Uniformes", priceMin: 900, priceMax: 2500, priceUnit: "lote" },
    ],
  },
  {
    id: "seed_provider_empaques",
    userId: "seed_user_provider_empaques",
    displayName: "Empaques Verdes Granada",
    slug: "empaques-verdes-granada",
    city: City.GRANADA,
    category: "Empaques ecológicos",
    mainCategory: "Empaques biodegradables",
    shortDescription: "Cajas, etiquetas y bolsas sostenibles para marcas locales.",
    aboutDescription: "Proveedor de empaques responsables para alimentos, café, cosmética artesanal y negocios que quieren mejorar su presentación sin perder identidad local.",
    priceRange: "HIGH",
    availability: Availability.BAJO_PEDIDO,
    formalizationStatus: FormalizationStatus.MIPYME_FORMAL,
    verified: true,
    verificationLevel: "COMPLETE",
    completedRequests: 32,
    responseTimeHrs: 1,
    lat: 11.9344,
    lng: -85.956,
    trust: 95,
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80",
    medals: ["PERFIL_COMPLETO", "MIPYME_FORMAL", "BUENAS_RESENAS", "SOLICITUDES_COMPLETADAS"],
    catalog: [
      { id: "seed_item_empaques_kraft", title: "Empaque kraft personalizado", itemType: "INSUMO", subcategory: "Cajas kraft", priceMin: 4, priceMax: 12, priceUnit: "unidad" },
      { id: "seed_item_empaques_etiquetas", title: "Etiquetas biodegradables", itemType: "MATERIA_PRIMA", subcategory: "Etiquetas", priceMin: 2, priceMax: 8, priceUnit: "unidad" },
    ],
  },
  {
    id: "seed_provider_tech",
    userId: "seed_user_provider_tech",
    displayName: "Nexo Digital Managua",
    slug: "nexo-digital-managua",
    city: City.MANAGUA,
    category: "Servicios tecnológicos",
    mainCategory: "Automatización y sitios web",
    shortDescription: "Sitios web, automatización y soporte para emprendimientos.",
    aboutDescription: "Equipo técnico que ayuda a negocios pequeños a crear presencia digital, automatizar procesos sencillos y ordenar su comunicación con clientes.",
    priceRange: "MEDIUM",
    availability: Availability.DISPONIBLE,
    formalizationStatus: FormalizationStatus.EN_PROCESO,
    verified: true,
    verificationLevel: "COMPLETE",
    completedRequests: 12,
    responseTimeHrs: 3,
    lat: 12.1328,
    lng: -86.2504,
    trust: 86,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    medals: ["PERFIL_COMPLETO", "TELEFONO_VERIFICADO", "RESPONDE_RAPIDO"],
    catalog: [
      { id: "seed_item_tech_web", title: "Sitio web para emprendimiento", itemType: "SERVICIO_ESPECIALIZADO", subcategory: "Desarrollo web", priceMin: 5500, priceMax: 16000, priceUnit: "proyecto" },
      { id: "seed_item_tech_soporte", title: "Soporte técnico mensual", itemType: "MANTENIMIENTO", subcategory: "Soporte", priceMin: 1200, priceMax: 3500, priceUnit: "mes" },
    ],
  },
  {
    id: "seed_provider_cafe",
    userId: "seed_user_provider_cafe",
    displayName: "Finca Café Segovia",
    slug: "finca-cafe-segovia",
    city: City.ESTELI,
    category: "Café y alimentos",
    mainCategory: "Café tostado local",
    shortDescription: "Café tostado, molido y paquetes para cafeterías pequeñas.",
    aboutDescription: "Finca familiar con café tostado de origen local, ideal para cafeterías, tiendas pequeñas y marcas que buscan producto nicaragüense constante.",
    priceRange: "MEDIUM",
    availability: Availability.DISPONIBLE,
    formalizationStatus: FormalizationStatus.INFORMAL,
    verified: false,
    verificationLevel: "PHONE",
    completedRequests: 7,
    responseTimeHrs: 6,
    lat: 13.0919,
    lng: -86.3538,
    trust: 74,
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
    medals: ["TELEFONO_VERIFICADO", "SOLICITUDES_COMPLETADAS"],
    catalog: [
      { id: "seed_item_cafe_molido", title: "Café molido para cafeterías", itemType: "PRODUCTO_FINAL", subcategory: "Café molido", priceMin: 180, priceMax: 320, priceUnit: "libra" },
      { id: "seed_item_cafe_degustacion", title: "Paquete de degustación local", itemType: "PRODUCTO_FINAL", subcategory: "Degustación", priceMin: 650, priceMax: 1200, priceUnit: "paquete" },
    ],
  },
  {
    id: "seed_provider_equipos",
    userId: "seed_user_provider_equipo",
    displayName: "Equipos Productivos León",
    slug: "equipos-productivos-leon",
    city: City.LEON,
    category: "Insumos agrícolas",
    mainCategory: "Alquiler y reparación de equipos",
    shortDescription: "Alquiler, reparación y capacitación para equipos productivos.",
    aboutDescription: "Proveedor orientado a talleres y pequeños productores que necesitan alquilar, reparar o aprender a usar equipos productivos sin comprar maquinaria nueva.",
    priceRange: "LOW",
    availability: Availability.OCUPADO,
    formalizationStatus: FormalizationStatus.EN_PROCESO,
    verified: false,
    verificationLevel: "PHONE",
    completedRequests: 4,
    responseTimeHrs: 12,
    lat: 12.4346,
    lng: -86.8796,
    trust: 62,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    medals: ["TELEFONO_VERIFICADO", "EQUIPO_PRODUCTIVO_DISPONIBLE"],
    catalog: [
      { id: "seed_item_equipo_maquina_coser", title: "Máquina de coser industrial en alquiler", itemType: "ALQUILER_EQUIPO", subcategory: "Máquinas de coser", priceMin: 700, priceMax: 700, priceUnit: "día", equipment: true },
      { id: "seed_item_equipo_reparacion", title: "Reparación de hornos pequeños", itemType: "REPARACION_MANTENIMIENTO", subcategory: "Hornos", priceMin: 900, priceMax: 2800, priceUnit: "servicio" },
    ],
  },
  {
    id: "seed_provider_marketing",
    userId: "seed_user_provider_marketing",
    displayName: "Impulso Marketing Matagalpa",
    slug: "impulso-marketing-matagalpa",
    city: City.MATAGALPA,
    category: "Marketing digital",
    mainCategory: "Contenido y campañas",
    shortDescription: "Campañas digitales, fotografía de producto y contenido local.",
    aboutDescription: "Estudio de marketing para emprendedores que necesitan mejorar contenido, lanzar campañas y presentar mejor sus productos en redes y marketplaces.",
    priceRange: "MEDIUM",
    availability: Availability.DISPONIBLE,
    formalizationStatus: FormalizationStatus.INFORMAL,
    verified: false,
    verificationLevel: "UNVERIFIED",
    completedRequests: 2,
    responseTimeHrs: 18,
    lat: 12.9256,
    lng: -85.9175,
    trust: 48,
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    medals: ["PERFIL_COMPLETO"],
    catalog: [
      { id: "seed_item_marketing_campana", title: "Campaña para lanzamiento", itemType: "SERVICIO_ESPECIALIZADO", subcategory: "Campañas", priceMin: 2500, priceMax: 9000, priceUnit: "proyecto" },
      { id: "seed_item_marketing_fotos", title: "Fotografía de producto", itemType: "SERVICIO_ESPECIALIZADO", subcategory: "Fotografía", priceMin: 1200, priceMax: 3500, priceUnit: "sesión" },
    ],
  },
] as const;

const threadSeeds = [
  {
    id: "seed_thread_completed_textil",
    senderId: "seed_user_requester",
    providerId: "seed_provider_textil",
    catalogItemId: "seed_item_textil_camisetas",
    subject: "Camisetas bordadas para equipo",
    status: "COMPLETED",
    quotedPriceLabel: "C$3,200",
    quotedDeliveryTime: "5 días",
    completed: true,
  },
  {
    id: "seed_thread_open_empaques",
    senderId: "seed_user_requester",
    providerId: "seed_provider_empaques",
    catalogItemId: "seed_item_empaques_kraft",
    subject: "Empaque para café molido",
    status: "IN_CONVERSATION",
    quotedPriceLabel: null,
    quotedDeliveryTime: null,
    completed: false,
  },
  {
    id: "seed_thread_quote_tech",
    senderId: "seed_user_provider_textil",
    providerId: "seed_provider_tech",
    catalogItemId: "seed_item_tech_web",
    subject: "Sitio web para catálogo textil",
    status: "QUOTE_SENT",
    quotedPriceLabel: "C$9,500",
    quotedDeliveryTime: "10 días",
    completed: false,
  },
] as const;

async function main() {
  const password = await bcrypt.hash(PASSWORD, 12);

  await prisma.quoteMessage.deleteMany({ where: { threadId: { startsWith: "seed_" } } });
  await prisma.quoteThread.deleteMany({ where: { id: { startsWith: "seed_" } } });
  await prisma.review.deleteMany({ where: { id: { startsWith: "seed_" } } });
  await prisma.catalogItemPhoto.deleteMany({ where: { catalogItemId: { startsWith: "seed_" } } });
  await prisma.equipmentDetail.deleteMany({ where: { catalogItemId: { startsWith: "seed_" } } });
  await prisma.catalogItem.deleteMany({ where: { id: { startsWith: "seed_" } } });
  await prisma.providerPhoto.deleteMany({ where: { providerId: { startsWith: "seed_" } } });
  await prisma.providerMedal.deleteMany({ where: { providerId: { startsWith: "seed_" } } });
  await prisma.formalizationChecklist.deleteMany({ where: { providerId: { startsWith: "seed_" } } });
  await prisma.trustScore.deleteMany({ where: { providerId: { startsWith: "seed_" } } });
  await prisma.provider.deleteMany({ where: { id: { startsWith: "seed_" } } });

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { id: user.id, name: user.name, role: user.role, password, emailVerified: now },
      create: { id: user.id, email: user.email, name: user.name, role: user.role, password, emailVerified: now },
    });
  }

  for (const provider of providerSeeds) {
    await prisma.provider.create({
      data: {
        id: provider.id,
        userId: provider.userId,
        displayName: provider.displayName,
        slug: provider.slug,
        city: provider.city,
        category: provider.category,
        mainCategory: provider.mainCategory,
        shortDescription: provider.shortDescription,
        aboutDescription: provider.aboutDescription,
        priceRange: provider.priceRange,
        availability: provider.availability,
        formalizationStatus: provider.formalizationStatus,
        verified: provider.verified,
        verificationLevel: provider.verificationLevel,
        profileCompleteness: provider.trust >= 80 ? 100 : 76,
        completedRequests: provider.completedRequests,
        responseTimeHrs: provider.responseTimeHrs,
        lat: provider.lat,
        lng: provider.lng,
        coverImageUrl: provider.image,
        photos: {
          create: [
            { imageUrl: provider.image, photoType: "PORTAFOLIO", isFeatured: true },
          ],
        },
        medals: {
          create: provider.medals.map(medalType => ({
            medalType,
            sourceEvent: "seed-data",
          })),
        },
        trustScore: {
          create: {
            scoreCompleteness: provider.trust >= 80 ? 100 : 75,
            scoreTransactions: Math.min(provider.completedRequests * 5, 100),
            scoreResponseTime: Math.max(20, 100 - provider.responseTimeHrs * 4),
            scoreReviews: provider.trust,
            scoreFormalization: provider.formalizationStatus === FormalizationStatus.MIPYME_FORMAL ? 100 : 50,
            finalScore: provider.trust,
            features: {
              seeded: true,
              completedRequests: provider.completedRequests,
              responseTimeHrs: provider.responseTimeHrs,
            },
          },
        },
        checklistState: {
          create: {
            steps: [
              { id: "basic", title: "Información básica", status: "completed" },
              { id: "catalog", title: "Catálogo inicial", status: "completed" },
              { id: "docs", title: "Documentos de formalización", status: provider.formalizationStatus === FormalizationStatus.MIPYME_FORMAL ? "completed" : "pending" },
            ],
          },
        },
      },
    });

    for (const item of provider.catalog) {
      await prisma.catalogItem.create({
        data: {
          id: item.id,
          providerId: provider.id,
          title: item.title,
          itemType: item.itemType,
          category: provider.category,
          subcategory: item.subcategory,
          description: `${item.title} ofrecido por ${provider.displayName}. Seed data para validar búsqueda, perfil público, solicitudes y catálogo.`,
          priceMin: item.priceMin,
          priceMax: item.priceMax,
          priceUnit: item.priceUnit,
          city: provider.city,
          availabilityStatus: provider.availability,
          deliveryAvailable: true,
          pickupAvailable: true,
          mainImageUrl: provider.image,
          viewCount: 20 + provider.completedRequests,
          inquiryCount: Math.max(2, Math.floor(provider.completedRequests / 2)),
          equipmentDetail: "equipment" in item && item.equipment ? {
            create: {
              modality: "ALQUILER",
              brand: "Industrial",
              model: "Seed demo",
              condition: "Buen estado",
              capacity: "Uso para talleres pequeños",
              requiresTraining: true,
              includesInstallation: false,
              maintenanceAvailable: true,
            },
          } : undefined,
          photos: {
            create: [{ imageUrl: provider.image, caption: item.title, isFeatured: true }],
          },
        },
      });
    }
  }

  for (const thread of threadSeeds) {
    const completedAt = thread.completed ? new Date("2026-07-02T16:00:00.000Z") : null;
    await prisma.quoteThread.create({
      data: {
        id: thread.id,
        senderId: thread.senderId,
        providerId: thread.providerId,
        catalogItemId: thread.catalogItemId,
        subject: thread.subject,
        clientName: users.find(user => user.id === thread.senderId)?.name ?? "Cliente seed",
        clientAvatar: "SE",
        dateLabel: thread.completed ? "Completada" : "Reciente",
        status: thread.status,
        quotedPriceLabel: thread.quotedPriceLabel,
        quotedDeliveryTime: thread.quotedDeliveryTime,
        confirmedByRequesterAt: completedAt,
        confirmedByProviderAt: completedAt,
        completedAt,
        messages: {
          create: [
            {
              id: `${thread.id}_msg_1`,
              authorId: thread.senderId,
              authorRole: "client",
              body: `Hola, necesito una propuesta para: ${thread.subject}.`,
              createdAt: new Date("2026-07-01T10:00:00.000Z"),
            },
            {
              id: `${thread.id}_msg_2`,
              authorId: providerSeeds.find(provider => provider.id === thread.providerId)?.userId ?? thread.providerId,
              authorRole: "provider",
              body: thread.quotedPriceLabel ? `Gracias. Puedo cotizarlo en ${thread.quotedPriceLabel} con entrega de ${thread.quotedDeliveryTime}.` : "Gracias por escribir. Revisemos cantidades, fecha y alcance para darte una propuesta clara.",
              createdAt: new Date("2026-07-01T12:00:00.000Z"),
            },
          ],
        },
      },
    });
  }

  await prisma.review.create({
    data: {
      id: "seed_review_textil_completed",
      providerId: "seed_provider_textil",
      reviewerId: "seed_user_requester",
      requestId: "seed_thread_completed_textil",
      qualityScore: 5,
      responseTimeScore: 5,
      fulfillmentScore: 5,
      communicationScore: 4,
      valueScore: 5,
      generalScore: 4.8,
      comment: "Trabajo confirmado dentro de la plataforma. Buena comunicación y entrega según lo acordado.",
      sentiment: 0.9,
      createdAt: new Date("2026-07-03T10:00:00.000Z"),
    },
  });

  console.log("Seed data ready.");
  console.log(`Demo password for all seed users: ${PASSWORD}`);
  console.log("Try: requester@conecta.test, textil@conecta.test, admin@conecta.test");
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
