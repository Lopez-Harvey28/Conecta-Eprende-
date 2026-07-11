import type { AuthSessionDTO } from "../lib/identity";
import type { ProviderProfile } from "../lib/mvp-data";
import { apiRequest } from "./http";

export const profileApi = {
  getCurrentUser:()=>apiRequest<AuthSessionDTO>("/me"),
  getRequesterProfile:(userId:string)=>apiRequest(`/api/requesters/${encodeURIComponent(userId)}`),
  getProviderProfile:(providerProfileId:string)=>apiRequest<{success:boolean;data:ProviderProfile}>(`/api/providers/${encodeURIComponent(providerProfileId)}`),
  getMyProviderProfile:()=>apiRequest<ProviderProfile>("/api/providers/me"),
  createProviderProfile:(data:Partial<ProviderProfile>)=>apiRequest<ProviderProfile>("/api/providers",{method:"POST",body:JSON.stringify(data)}),
  updateProviderProfile:(providerProfileId:string,data:Partial<ProviderProfile>)=>apiRequest<{success:boolean;data:ProviderProfile}>(`/api/providers/${encodeURIComponent(providerProfileId)}`,{method:"PATCH",body:JSON.stringify(data)}),
};
