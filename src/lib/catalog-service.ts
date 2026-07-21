import { prisma } from "./db";
import type { ProviderStatus } from "@prisma/client";
import { PUBLICLY_VISIBLE_STATUSES } from "./providers-service";

function mapCatalogItem(item: any) {
  return {
    ...item,
    city: item.cityRef?.name ?? item.city,
    category: item.categoryLinks?.find((link: any) => !link.isPrimary)?.category?.name ?? item.category,
    subcategory: item.categoryLinks?.find((link: any) => link.isPrimary)?.category?.name ?? item.subcategory,
    viewCount: item.metrics?.viewCount ?? item.viewCount,
    inquiryCount: item.metrics?.inquiryCount ?? item.inquiryCount,
  };
}

export async function searchCatalogItems(params: {
  q?: string;
  city?: string;
  providerId?: string;
  includeStatuses?: ProviderStatus[];
}): Promise<any[]> {
  const { q, city, providerId } = params;
  const includeStatuses = params.includeStatuses ?? PUBLICLY_VISIBLE_STATUSES;

  let where: any = {
    provider: { status: { in: includeStatuses } },
  };

  if (providerId) {
    where.providerId = providerId;
    // When a specific provider is requested we keep the status filter so the
    // caller does not silently get items from a non-public provider.
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
          status: true,
          verified: true,
          trustScore: { select: { finalScore: true } },
          metrics: { select: { trustScore: true } },
        },
      },
      cityRef: { include: { department: true } },
      categoryLinks: { include: { category: true } },
      equipmentDetail: true,
      metrics: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map(mapCatalogItem);
}

export async function getCatalogByProvider(providerId: string): Promise<any[]> {
  return prisma.catalogItem.findMany({
    where: { providerId },
    include: {
      equipmentDetail: true,
      photos: true,
      cityRef: { include: { department: true } },
      categoryLinks: { include: { category: true } },
      metrics: true,
    },
    orderBy: { createdAt: "desc" },
  }).then((items) => items.map(mapCatalogItem));
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
          userId: true,
          status: true,
          city: true,
          cityRef: true,
          verified: true,
          trustScore: { select: { finalScore: true } },
          metrics: { select: { trustScore: true } },
        },
      },
      equipmentDetail: true,
      photos: true,
      cityRef: { include: { department: true } },
      categoryLinks: { include: { category: true } },
      metrics: true,
    },
  }).then((item) => item ? mapCatalogItem(item) : null);
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
