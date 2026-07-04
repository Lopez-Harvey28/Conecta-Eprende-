import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sanitizePlainText } from "../lib/content-validation";
import { seedOffers, seedProviders, seedRequests, seedReviews, seedReports, type MessageType, type ProviderOffer, type ProviderProfile, type QuoteRequest, type Report, type Review } from "../lib/mvp-data";

export type CurrentUser = {id:string;name:string;email:string;role:"PROVIDER"|"ADMIN";providerId:string;phoneVerified:boolean};
export type RequestRole = "requester" | "provider";

export function getRequestRole(request:QuoteRequest,user:CurrentUser):RequestRole|null {
  if(request.requesterId===user.id)return "requester";
  if(request.providerId===user.providerId)return "provider";
  return null;
}

interface MvpState {
  providers:ProviderProfile[]; offers:ProviderOffer[]; requests:QuoteRequest[]; reviews:Review[]; reports:Report[];
  formalizationSteps:Record<string,boolean[]>;
  savedProviderIds:string[];
  currentUser:CurrentUser; toast:string|null;
  setToast:(message:string|null)=>void;
  setCurrentRole:(role:CurrentUser["role"])=>void;
  updateProvider:(id:string,patch:Partial<ProviderProfile>)=>boolean;
  addOffer:(offer:ProviderOffer)=>boolean;
  updateOffer:(id:string,patch:Partial<ProviderOffer>)=>boolean;
  archiveOffer:(id:string)=>boolean;
  createRequest:(request:QuoteRequest)=>boolean;
  addMessage:(id:string,text:string,type?:MessageType,metadata?:Record<string,unknown>)=>boolean;
  sendQuote:(id:string,price:string,delivery:string)=>boolean;
  acceptQuote:(id:string)=>boolean;
  markConversationRead:(id:string)=>void;
  confirmRequest:(id:string)=>boolean;
  closeRequest:(id:string)=>boolean;
  addReview:(review:Review)=>boolean;
  addReport:(report:Report)=>boolean;
  updateReport:(id:string,status:Report["status"])=>boolean;
  toggleFormalizationStep:(index:number)=>void;
  toggleSavedProvider:(id:string)=>void;
}

const now=()=>new Date().toISOString();
const closedStatuses=["COMPLETED","CLOSED_BY_REQUESTER","CLOSED_BY_PROVIDER","CANCELLED"];
const fail=(set:(value:Partial<MvpState>)=>void,message:string)=>{set({toast:message});return false;};

export const useMvpStore=create<MvpState>()(persist((set,get)=>({
  providers:seedProviders,offers:seedOffers,requests:seedRequests,reviews:seedReviews,reports:seedReports,
  formalizationSteps:{"provider-1":[true,true,false,false]},
  savedProviderIds:[],
  currentUser:{id:"user-provider",name:"María Fernanda Ruiz",email:"maria@conecta.ni",role:"PROVIDER",providerId:"provider-1",phoneVerified:true},
  toast:null,
  setToast:toast=>set({toast}),
  setCurrentRole:role=>set(state=>({currentUser:{...state.currentUser,role},toast:role==="ADMIN"?"Modo administrador activado para la demo.":"Volviste al modo proveedor."})),
  updateProvider:(id,patch)=>{
    if(id!==get().currentUser.providerId)return fail(set,"No tenés permiso para editar este perfil.");
    set(state=>({providers:state.providers.map(provider=>provider.id===id?{...provider,...patch,updatedAt:now()}:provider),toast:"Perfil público actualizado."}));return true;
  },
  addOffer:offer=>{
    if(offer.providerId!==get().currentUser.providerId)return fail(set,"No tenés permiso para publicar en este perfil.");
    set(state=>({offers:[offer,...state.offers],toast:"Producto o servicio agregado al catálogo."}));return true;
  },
  updateOffer:(id,patch)=>{
    const offer=get().offers.find(item=>item.id===id);if(!offer||offer.providerId!==get().currentUser.providerId)return fail(set,"No tenés permiso para editar esta oferta.");
    set(state=>({offers:state.offers.map(item=>item.id===id?{...item,...patch,updatedAt:now()}:item),toast:"Oferta actualizada."}));return true;
  },
  archiveOffer:id=>{
    const offer=get().offers.find(item=>item.id===id);if(!offer||offer.providerId!==get().currentUser.providerId)return fail(set,"No tenés permiso para eliminar esta oferta.");
    set(state=>({offers:state.offers.map(item=>item.id===id?{...item,status:"ARCHIVED",updatedAt:now()}:item),toast:"Oferta eliminada del perfil público."}));return true;
  },
  createRequest:request=>{
    const state=get();
    if(request.requesterId!==state.currentUser.id)return fail(set,"No podés crear una solicitud a nombre de otra persona.");
    if(request.providerId===state.currentUser.providerId)return fail(set,"No podés enviarte una solicitud a tu propio perfil.");
    const tenMinutesAgo=Date.now()-10*60*1000;
    const duplicate=state.requests.some(item=>item.requesterId===state.currentUser.id&&item.providerId===request.providerId&&item.title.toLowerCase()===request.title.toLowerCase()&&new Date(item.createdAt).getTime()>tenMinutesAgo);
    if(duplicate)return fail(set,"Ya enviaste una solicitud igual a este proveedor. Esperá unos minutos antes de repetirla.");
    const profile=state.providers.find(provider=>provider.userId===state.currentUser.id);
    const ageDays=profile?Math.floor((Date.now()-new Date(profile.createdAt).getTime())/86400000):999;
    const limited=!!profile&&profile.verificationLevel!=="COMPLETE"&&ageDays<30;
    const active=state.requests.filter(item=>item.requesterId===state.currentUser.id&&!closedStatuses.includes(item.status)).length;
    if(limited&&active>=3)return fail(set,"Tenés demasiadas solicitudes activas. Cerrá o completá alguna antes de crear otra.");
    set(current=>({requests:[request,...current.requests],offers:request.productId?current.offers.map(offer=>offer.id===request.productId?{...offer,inquiryCount:offer.inquiryCount+1}:offer):current.offers,toast:"Solicitud creada. La conversación ya está protegida dentro de la app."}));return true;
  },
  addMessage:(id,text,type="TEXT",metadata)=>{
    const state=get();const request=state.requests.find(item=>item.id===id);if(!request)return fail(set,"No encontramos esta conversación.");
    const role=getRequestRole(request,state.currentUser);if(!role)return fail(set,"No participás en esta conversación.");
    const clean=sanitizePlainText(text);if(!clean)return fail(set,"Escribí un mensaje antes de enviarlo.");
    set(current=>({requests:current.requests.map(item=>item.id===id?{...item,status:item.status==="OPEN"?"IN_CONVERSATION":item.status,updatedAt:now(),unreadByProvider:role==="requester"?item.unreadByProvider+1:item.unreadByProvider,unreadByRequester:role==="provider"?item.unreadByRequester+1:item.unreadByRequester,messages:[...item.messages,{id:crypto.randomUUID(),author:role,senderId:state.currentUser.id,type,text:clean,metadata,createdAt:now()}]}:item)}));return true;
  },
  sendQuote:(id,price,delivery)=>{
    const state=get();const request=state.requests.find(item=>item.id===id);if(!request||getRequestRole(request,state.currentUser)!=="provider")return fail(set,"Solo el proveedor de esta solicitud puede enviar una cotización.");
    set(current=>({requests:current.requests.map(item=>item.id===id?{...item,status:"QUOTE_SENT",quotedPriceLabel:sanitizePlainText(price),quotedDeliveryTime:sanitizePlainText(delivery),updatedAt:now(),unreadByRequester:item.unreadByRequester+1,messages:[...item.messages,{id:crypto.randomUUID(),author:"provider",senderId:state.currentUser.id,type:"QUOTE_SUMMARY",text:`Cotización estimada: ${sanitizePlainText(price)} · Entrega: ${sanitizePlainText(delivery)} · Pendiente de aceptación.`,metadata:{price,delivery},createdAt:now()}]}:item),toast:"Cotización enviada dentro de la conversación."}));return true;
  },
  acceptQuote:id=>{
    const state=get();const request=state.requests.find(item=>item.id===id);if(!request||getRequestRole(request,state.currentUser)!=="requester")return fail(set,"Solo quien solicitó el trabajo puede aceptar la cotización.");
    set(current=>({requests:current.requests.map(item=>item.id===id?{...item,status:"QUOTE_ACCEPTED",updatedAt:now(),messages:[...item.messages,{id:crypto.randomUUID(),author:"system",senderId:"SYSTEM",type:"STATUS_UPDATE",text:"La cotización fue aceptada. El trabajo puede comenzar.",createdAt:now()}]}:item),toast:"Cotización aceptada."}));return true;
  },
  markConversationRead:id=>set(state=>({requests:state.requests.map(request=>{if(request.id!==id)return request;const role=getRequestRole(request,state.currentUser);if(!role)return request;return{...request,[role==="provider"?"unreadByProvider":"unreadByRequester"]:0};})})),
  confirmRequest:id=>{
    const state=get();const request=state.requests.find(item=>item.id===id);if(!request)return fail(set,"No encontramos esta solicitud.");const role=getRequestRole(request,state.currentUser);if(!role)return fail(set,"No participás en esta solicitud.");
    const timestamp=now();if(role==="requester"&&request.confirmedByRequesterAt||role==="provider"&&request.confirmedByProviderAt)return fail(set,"Tu confirmación ya estaba registrada.");
    set(current=>({requests:current.requests.map(item=>{if(item.id!==id)return item;const next={...item,updatedAt:timestamp,confirmedByRequesterAt:role==="requester"?timestamp:item.confirmedByRequesterAt,confirmedByProviderAt:role==="provider"?timestamp:item.confirmedByProviderAt};if(next.confirmedByRequesterAt&&next.confirmedByProviderAt)return{...next,status:"COMPLETED" as const,completedAt:timestamp,messages:[...next.messages,{id:crypto.randomUUID(),author:"system" as const,senderId:"SYSTEM" as const,type:"REVIEW_UNLOCKED" as const,text:"Solicitud completada. Ya podés dejar una reseña verificada.",createdAt:timestamp}]};return{...next,messages:[...next.messages,{id:crypto.randomUUID(),author:"system" as const,senderId:"SYSTEM" as const,type:"COMPLETION_REQUEST" as const,text:`${role==="provider"?"El proveedor":"El cliente"} confirmó el trabajo. Falta la confirmación de la otra parte.`,createdAt:timestamp}]};}),toast:"Tu confirmación quedó registrada."}));return true;
  },
  closeRequest:id=>{
    const state=get();const request=state.requests.find(item=>item.id===id);if(!request)return fail(set,"No encontramos esta solicitud.");const role=getRequestRole(request,state.currentUser);if(!role)return fail(set,"No participás en esta solicitud.");
    set(current=>({requests:current.requests.map(item=>item.id===id?{...item,status:role==="requester"?"CLOSED_BY_REQUESTER":"CLOSED_BY_PROVIDER",updatedAt:now()}:item),toast:"Tu parte de la solicitud fue cerrada."}));return true;
  },
  addReview:review=>{const state=get();const request=state.requests.find(item=>item.id===review.requestId);if(!request||request.status!=="COMPLETED"||request.requesterId!==state.currentUser.id||review.reviewerId!==state.currentUser.id||state.reviews.some(item=>item.requestId===review.requestId&&item.reviewerId===review.reviewerId))return fail(set,"Esta reseña no está habilitada para tu cuenta.");set(current=>({reviews:[review,...current.reviews],toast:"Reseña publicada."}));return true;},
  addReport:report=>{if(report.reporterId!==get().currentUser.id)return fail(set,"No podés enviar un reporte a nombre de otra persona.");set(state=>({reports:[report,...state.reports],toast:"Reporte enviado. El equipo lo revisará manualmente."}));return true;},
  updateReport:(id,status)=>{if(get().currentUser.role!=="ADMIN")return fail(set,"Solo administración puede revisar reportes.");set(state=>({reports:state.reports.map(report=>report.id===id?{...report,status}:report),toast:"Estado del reporte actualizado."}));return true;},
  toggleFormalizationStep:index=>set(state=>{const current=state.formalizationSteps[state.currentUser.providerId]??[true,true,false,false];const next=current.map((done,itemIndex)=>itemIndex===index?!done:done);const completed=next.filter(Boolean).length;return{formalizationSteps:{...state.formalizationSteps,[state.currentUser.providerId]:next},providers:state.providers.map(provider=>provider.id===state.currentUser.providerId?{...provider,formalizationStatus:provider.formalizationStatus==="MIPYME"?"MIPYME":completed>0?"IN_PROGRESS":"INFORMAL",updatedAt:now()}:provider),toast:"Progreso de formalización guardado."};}),
  toggleSavedProvider:id=>set(state=>{const saved=state.savedProviderIds.includes(id);return{savedProviderIds:saved?state.savedProviderIds.filter(item=>item!==id):[...state.savedProviderIds,id],toast:saved?"Proveedor eliminado de guardados.":"Proveedor guardado."};}),
}),{name:"conecta-emprende-mvp-v7",partialize:state=>({providers:state.providers,offers:state.offers,requests:state.requests,reviews:state.reviews,reports:state.reports,formalizationSteps:state.formalizationSteps,savedProviderIds:state.savedProviderIds,currentUser:state.currentUser})}));
