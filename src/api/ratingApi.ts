import type { Review } from "../lib/mvp-data";
import { apiRequest } from "./http";

export const ratingApi = {
  getProviderRating:(providerProfileId:string)=>apiRequest<{avgRating:number|null;totalVerifiedReviews:number}>(`/api/providers/${encodeURIComponent(providerProfileId)}/rating`),
  getTrustScore:(providerProfileId:string)=>apiRequest<{trustScore:number|null}>(`/api/providers/${encodeURIComponent(providerProfileId)}/trust-score`),
  getVerifiedReviews:(providerProfileId:string)=>apiRequest<Review[]>(`/api/providers/${encodeURIComponent(providerProfileId)}/reviews`),
};
