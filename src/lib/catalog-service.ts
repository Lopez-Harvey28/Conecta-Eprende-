import { prisma } from "./db";

export async function searchCatalogItems(params: {
  q?: string;
  city?: string;
  providerId?: string;
}): Promise<any[]> {
  const { q, city, providerId } = params;

  let where: any = {};

  if (providerId) {
    where.providerId = providerId;
  }

  if (city) {
    where.city = city;
  }

  if (q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    where.AND = words.map((word) => ({
      OR: [
        { title: { contains: word, mode: "insensitive" } },
        { category: { contains: word, mode: "insensitive" } },
        { subcategory: { contains: word, mode: "insensitive" } },
        { itemType: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
      ],
    }));
  }

  const items = await prisma.catalogItem.findMany({
    where,
    include: {
      provider: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          verified: true,
          trustScore: { select: { finalScore: true } },
        },
      },
      equipmentDetail: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return items;
}

export async function getCatalogByProvider(providerId: string): Promise<any[]> {
  return prisma.catalogItem.findMany({
    where: { providerId },
    include: {
      equipmentDetail: true,
      photos: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCatalogItem(id: string): Promise<any | null> {
  return prisma.catalogItem.findUnique({
    where: { id },
    include: {
      provider: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          city: true,
          verified: true,
          trustScore: { select: { finalScore: true } },
        },
      },
      equipmentDetail: true,
      photos: true,
    },
  });
}

export async function createCatalogItem(data: {
  providerId: string;
  title: string;
  itemType: string;
  category: string;
  subcategory: string;
  description: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  priceUnit?: string;
  city: string;
  availabilityStatus: string;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  mainImageUrl?: string;
}): Promise<any> {
  return prisma.catalogItem.create({
    data: {
      providerId: data.providerId,
      title: data.title,
      itemType: data.itemType,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      currency: data.currency || "NIO",
      priceUnit: data.priceUnit,
      city: data.city,
      availabilityStatus: data.availabilityStatus as any,
      deliveryAvailable: data.deliveryAvailable ?? false,
      pickupAvailable: data.pickupAvailable ?? false,
      mainImageUrl: data.mainImageUrl,
    },
  });
}

export async function updateCatalogItem(
  id: string,
  data: Record<string, any>
): Promise<any> {
  const { id: _id, providerId: _providerId, equipmentDetail, photos: _photos, ...rest } = data;

  return prisma.catalogItem.update({
    where: { id },
    data: rest,
  });
}

export async function deleteCatalogItem(id: string): Promise<void> {
  await prisma.catalogItem.delete({ where: { id } });
}