import { prisma } from "./db";
import { LegacyCity } from "@prisma/client";

export interface ProviderSearchResult {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  city: LegacyCity | string;
  mainCategory: string | null;
  category: string;
  shortDescription: string | null;
  priceRange: string | null;
  availability: string;
  verified: boolean;
  verificationLevel: string | null;
  formalizationStatus: string;
  trustScore: number;
  responseTimeHrs: number | null;
  completedRequests: number;
  photos: string[];
  lat: number | null;
  lng: number | null;
}

export interface FullProviderData {
  provider: any;
  catalogItems: any[];
  photos: any[];
  medals: any[];
  reviews: any[];
  averageReviewScore: number | null;
  completedRequestsCount: number;
}

function primaryCategoryFromLinks(categoryLinks?: Array<{ isPrimary: boolean; category: { name: string } }>) {
  return categoryLinks?.find((link) => link.isPrimary)?.category.name ?? null;
}

function firstSecondaryCategoryFromLinks(categoryLinks?: Array<{ isPrimary: boolean; category: { name: string } }>) {
  return categoryLinks?.find((link) => !link.isPrimary)?.category.name ?? null;
}

function categoryNamesFromLinks(categoryLinks?: Array<{ category: { name: string } }>) {
  return categoryLinks?.map((link) => link.category.name).filter(Boolean) ?? [];
}

export async function searchProviders(params: {
  q?: string;
  city?: string;
}): Promise<ProviderSearchResult[]> {
  const { q, city } = params;

  let where: any = {};

  if (city) {
    where.city = city.toUpperCase();
  }

  const providers = await prisma.provider.findMany({
    where,
    select: {
      id: true,
      userId: true,
      displayName: true,
      slug: true,
      city: true,
      cityRef: { select: { name: true, department: { select: { name: true } } } },
      mainCategory: true,
      category: true,
      categoryLinks: {
        include: { category: { select: { name: true } } },
      },
      shortDescription: true,
      priceRange: true,
      availability: true,
      verified: true,
      verificationLevel: true,
      formalizationStatus: true,
      trustScore: {
        select: { finalScore: true },
      },
      metrics: {
        select: {
          trustScore: true,
          responseTimeHrs: true,
          completedRequests: true,
        },
      },
      responseTimeHrs: true,
      completedRequests: true,
      photos: {
        where: { isFeatured: true },
        select: { imageUrl: true },
        take: 1,
      },
      lat: true,
      lng: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let results = providers.map((p) => ({
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    slug: p.slug,
    city: p.cityRef?.name ?? p.city,
    mainCategory: primaryCategoryFromLinks(p.categoryLinks) ?? p.mainCategory,
    category: firstSecondaryCategoryFromLinks(p.categoryLinks) ?? p.category,
    shortDescription: p.shortDescription,
    priceRange: p.priceRange,
    availability: p.availability,
    verified: p.verified,
    verificationLevel: p.verificationLevel,
    formalizationStatus: p.formalizationStatus,
    trustScore: p.metrics?.trustScore ?? p.trustScore?.finalScore ?? 0,
    responseTimeHrs: p.metrics?.responseTimeHrs ?? p.responseTimeHrs,
    completedRequests: p.metrics?.completedRequests ?? p.completedRequests,
    photos: p.photos.map((ph) => ph.imageUrl),
    lat: p.lat,
    lng: p.lng,
  }));

  if (q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    results = results.filter((p) => {
      const providerText = (
        p.displayName + " " + p.category + " " + (p.mainCategory || "")
      ).toLowerCase();
      const providerMatch = words.some((w) => providerText.includes(w));
      if (providerMatch) return true;

      return false;
    });
  }

  return results;
}

export async function getFullProviderByIdOrSlug(idOrSlug: string): Promise<FullProviderData | null> {
  const provider = await prisma.provider.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      photos: true,
      catalogItems: {
        include: {
          equipmentDetail: true,
          photos: true,
          cityRef: { select: { name: true, department: { select: { name: true } } } },
          categoryLinks: { include: { category: { select: { name: true } } } },
          metrics: true,
        },
      },
      medals: true,
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
          analysis: true,
        },
        orderBy: { createdAt: "desc" },
      },
      trustScore: true,
      metrics: true,
      cityRef: { include: { department: true } },
      categoryLinks: { include: { category: true } },
      trustScoreSnapshots: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
  });

  if (!provider) return null;

  const avgScore =
    provider.reviews.length > 0
      ? Math.round(
          (provider.reviews.reduce((sum, r) => sum + r.generalScore, 0) /
            provider.reviews.length) *
            10
        ) / 10
      : null;

  return {
    provider: {
      ...provider,
      city: provider.cityRef?.name ?? provider.city,
      department: provider.cityRef?.department?.name ?? provider.department,
      category: firstSecondaryCategoryFromLinks(provider.categoryLinks) ?? provider.category,
      mainCategory: primaryCategoryFromLinks(provider.categoryLinks) ?? provider.mainCategory,
      subcategories: categoryNamesFromLinks(provider.categoryLinks),
      trustScore: provider.metrics ? { finalScore: provider.metrics.trustScore } : provider.trustScore,
      responseTimeHrs: provider.metrics?.responseTimeHrs ?? provider.responseTimeHrs,
      completedRequests: provider.metrics?.completedRequests ?? provider.completedRequests,
      profileCompleteness: provider.metrics?.profileCompleteness ?? provider.profileCompleteness,
    },
    catalogItems: provider.catalogItems.map((item) => ({
      ...item,
      city: item.cityRef?.name ?? item.city,
      category: firstSecondaryCategoryFromLinks(item.categoryLinks) ?? item.category,
      subcategory: primaryCategoryFromLinks(item.categoryLinks) ?? item.subcategory,
      viewCount: item.metrics?.viewCount ?? item.viewCount,
      inquiryCount: item.metrics?.inquiryCount ?? item.inquiryCount,
    })),
    photos: provider.photos,
    medals: provider.medals,
    reviews: provider.reviews,
    averageReviewScore: avgScore,
    completedRequestsCount: provider.metrics?.completedRequests ?? provider.completedRequests,
  };
}

export async function updateProvider(
  providerId: string,
  data: Record<string, any>
): Promise<any> {
  const {
    id,
    userId,
    trustScore,
    metrics,
    reviews,
    quoteThreads,
    checklistState,
    formalizationSteps,
    businessHourRows,
    deliveryOptionRows,
    photos,
    catalogItems,
    medals,
    categoryLinks,
    cityRef,
    trustScoreSnapshots,
    riskReports,
    ...rest
  } = data;

  return prisma.provider.update({
    where: { id: providerId },
    data: rest,
  });
}

export async function getProviderMapData(city?: string): Promise<Array<{ id: string; displayName: string; lat: number; lng: number; category: string; availability: string; verified: boolean; trustScore: number; shortDescription: string | null }>> {
  let where: any = {};
  if (city) {
    where.city = city.toUpperCase();
  }

  const providers = await prisma.provider.findMany({
    where,
    select: {
      id: true,
      displayName: true,
      lat: true,
      lng: true,
      category: true,
      categoryLinks: { include: { category: { select: { name: true } } } },
      availability: true,
      verified: true,
      shortDescription: true,
      trustScore: { select: { finalScore: true } },
      metrics: { select: { trustScore: true } },
    },
  });

  return providers
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      displayName: p.displayName,
      lat: p.lat!,
      lng: p.lng!,
      category: primaryCategoryFromLinks(p.categoryLinks) ?? p.category,
      availability: p.availability,
      verified: p.verified,
      trustScore: p.metrics?.trustScore ?? p.trustScore?.finalScore ?? 0,
      shortDescription: p.shortDescription,
    }));
}
