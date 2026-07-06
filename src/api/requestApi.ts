import type { QuoteRequest, RequestStatus } from "../lib/mvp-data";
import { apiRequest } from "./http";

export const requestApi = {
  createRequest:(data:Partial<QuoteRequest>)=>apiRequest<QuoteRequest>("/api/requests",{method:"POST",body:JSON.stringify(data)}),
  getSentRequests:()=>apiRequest<QuoteRequest[]>("/api/requests?scope=sent"),
  getReceivedRequests:(providerProfileId:string)=>apiRequest<QuoteRequest[]>(`/api/requests?scope=received&providerProfileId=${encodeURIComponent(providerProfileId)}`),
  updateRequestStatus:(requestId:string,status:RequestStatus)=>apiRequest<QuoteRequest>(`/api/requests/${encodeURIComponent(requestId)}/status`,{method:"PATCH",body:JSON.stringify({status})}),
  confirmCompletion:(requestId:string)=>apiRequest<QuoteRequest>(`/api/requests/${encodeURIComponent(requestId)}/confirm-completion`,{method:"POST"}),
};
