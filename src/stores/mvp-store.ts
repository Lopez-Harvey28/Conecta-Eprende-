import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedOffers, seedProviders, seedRequests, seedReviews, seedReports, type MessageType, type ProviderOffer, type ProviderProfile, type QuoteRequest, type Report, type Review } from "../lib/mvp-data";

interface MvpState {
  providers:ProviderProfile[]; offers:ProviderOffer[]; requests:QuoteRequest[]; reviews:Review[]; reports:Report[];
  currentUser:{id:string;name:string;email:string;role:"PROVIDER"|"ADMIN";providerId:string;phoneVerified:boolean};
  toast:string|null;
  setToast:(message:string|null)=>void;
  updateProvider:(id:string,patch:Partial<ProviderProfile>)=>void;
  addOffer:(offer:ProviderOffer)=>void;
  updateOffer:(id:string,patch:Partial<ProviderOffer>)=>void;
  archiveOffer:(id:string)=>void;
  createRequest:(request:QuoteRequest)=>void;
  addMessage:(id:string,text:string,author:"requester"|"provider",type?:MessageType,metadata?:Record<string,unknown>)=>void;
  sendQuote:(id:string,price:string,delivery:string)=>void;
  acceptQuote:(id:string)=>void;
  markConversationRead:(id:string,role:"requester"|"provider")=>void;
  confirmRequest:(id:string,role:"requester"|"provider")=>void;
  closeRequest:(id:string,role:"requester"|"provider")=>void;
  addReview:(review:Review)=>boolean;
  addReport:(report:Report)=>void;
  updateReport:(id:string,status:Report["status"])=>void;
}

const now=()=>new Date().toISOString();
export const useMvpStore=create<MvpState>()(persist((set,get)=>({
  providers:seedProviders,offers:seedOffers,requests:seedRequests,reviews:seedReviews,reports:seedReports,
  currentUser:{id:"user-provider",name:"María Fernanda Ruiz",email:"maria@conecta.ni",role:"ADMIN",providerId:"provider-1",phoneVerified:true},
  toast:null,setToast:toast=>set({toast}),
  updateProvider:(id,patch)=>set(state=>({providers:state.providers.map(provider=>provider.id===id?{...provider,...patch,updatedAt:now()}:provider),toast:"Perfil público actualizado."})),
  addOffer:offer=>set(state=>({offers:[offer,...state.offers],toast:"Producto o servicio agregado al catálogo."})),
  updateOffer:(id,patch)=>set(state=>({offers:state.offers.map(offer=>offer.id===id?{...offer,...patch,updatedAt:now()}:offer),toast:"Oferta actualizada."})),
  archiveOffer:id=>set(state=>({offers:state.offers.map(offer=>offer.id===id?{...offer,status:"ARCHIVED",updatedAt:now()}:offer),toast:"Oferta archivada."})),
  createRequest:request=>{const state=get();const profile=state.providers.find(provider=>provider.userId===state.currentUser.id);const ageDays=profile?Math.floor((Date.now()-new Date(profile.createdAt).getTime())/86400000):999;const limited=profile&&profile.verificationLevel!=="COMPLETE"&&ageDays<30;const active=state.requests.filter(item=>item.requesterId===state.currentUser.id&&!(["COMPLETED","CLOSED_REQUESTER","CLOSED_PROVIDER","CANCELLED"] as string[]).includes(item.status)).length;if(limited&&active>=3){set({toast:"Tenés demasiadas solicitudes activas. Cerrá o completá alguna antes de crear otra."});return;}set(current=>({requests:[request,...current.requests],offers:request.productId?current.offers.map(offer=>offer.id===request.productId?{...offer,inquiryCount:offer.inquiryCount+1}:offer):current.offers,toast:"Solicitud creada. La conversación ya está protegida dentro de la app."}));},
  addMessage:(id,text,author,type="TEXT",metadata)=>set(state=>({requests:state.requests.map(request=>request.id===id?{...request,status:request.status==="OPEN"?"IN_CONVERSATION":request.status,updatedAt:now(),unreadByProvider:author==="requester"?request.unreadByProvider+1:request.unreadByProvider,unreadByRequester:author==="provider"?request.unreadByRequester+1:request.unreadByRequester,messages:[...request.messages,{id:crypto.randomUUID(),author,senderId:author==="provider"?state.currentUser.id:request.requesterId,type,text,metadata,createdAt:now()}]}:request)})),
  sendQuote:(id,price,delivery)=>set(state=>({requests:state.requests.map(request=>request.id===id?{...request,status:"QUOTE_SENT",quotedPriceLabel:price,quotedDeliveryTime:delivery,updatedAt:now(),unreadByRequester:request.unreadByRequester+1,messages:[...request.messages,{id:crypto.randomUUID(),author:"provider",senderId:state.currentUser.id,type:"QUOTE_SUMMARY",text:`Cotización estimada: ${price} · Entrega: ${delivery} · Pendiente de aceptación.`,metadata:{price,delivery},createdAt:now()}]}:request),toast:"Cotización enviada dentro de la conversación."})),
  acceptQuote:id=>set(state=>({requests:state.requests.map(request=>request.id===id?{...request,status:"QUOTE_ACCEPTED",updatedAt:now(),messages:[...request.messages,{id:crypto.randomUUID(),author:"system",senderId:"SYSTEM",type:"STATUS_UPDATE",text:"La cotización fue aceptada. El trabajo puede comenzar.",createdAt:now()}]}:request),toast:"Cotización aceptada."})),
  markConversationRead:(id,role)=>set(state=>({requests:state.requests.map(request=>request.id===id?{...request,[role==="provider"?"unreadByProvider":"unreadByRequester"]:0}:request)})),
  confirmRequest:(id,role)=>set(state=>({requests:state.requests.map(request=>{if(request.id!==id)return request;const timestamp=now();const next={...request,updatedAt:timestamp,confirmedByRequesterAt:role==="requester"?timestamp:request.confirmedByRequesterAt,confirmedByProviderAt:role==="provider"?timestamp:request.confirmedByProviderAt};if(next.confirmedByRequesterAt&&next.confirmedByProviderAt)return{...next,status:"COMPLETED" as const,completedAt:timestamp,messages:[...next.messages,{id:crypto.randomUUID(),author:"system" as const,senderId:"SYSTEM" as const,type:"REVIEW_UNLOCKED" as const,text:"Solicitud completada. Ya podés dejar una reseña verificada.",createdAt:timestamp}]};return{...next,messages:[...next.messages,{id:crypto.randomUUID(),author:"system" as const,senderId:"SYSTEM" as const,type:"COMPLETION_REQUEST" as const,text:"Una parte confirmó el trabajo. Esperando confirmación de la otra parte.",createdAt:timestamp}]};}),toast:"Confirmación registrada."})),
  closeRequest:(id,role)=>set(state=>({requests:state.requests.map(request=>request.id===id?{...request,status:role==="requester"?"CLOSED_REQUESTER":"CLOSED_PROVIDER",updatedAt:now()}:request),toast:"Tu parte de la solicitud fue cerrada."})),
  addReview:review=>{const request=get().requests.find(item=>item.id===review.requestId);if(!request||request.status!=="COMPLETED"||get().reviews.some(item=>item.requestId===review.requestId&&item.reviewerId===review.reviewerId))return false;set(state=>({reviews:[review,...state.reviews],toast:"Reseña publicada."}));return true;},
  addReport:report=>set(state=>({reports:[report,...state.reports],toast:"Reporte enviado. Será revisado por una persona del equipo."})),
  updateReport:(id,status)=>set(state=>({reports:state.reports.map(report=>report.id===id?{...report,status}:report),toast:"Estado del reporte actualizado."})),
}),{name:"conecta-emprende-mvp-v6",partialize:state=>({providers:state.providers,offers:state.offers,requests:state.requests,reviews:state.reviews,reports:state.reports,currentUser:state.currentUser})}));
