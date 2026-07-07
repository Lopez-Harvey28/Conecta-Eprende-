import type { ClientProfile, Role, RoleAssignment, UserAccount } from "../lib/identity";
import type { ProviderOffer, ProviderProfile } from "../lib/mvp-data";
import type { AuthUser } from "../stores/auth-store";

export type DemoProfileOption = {
  id:string;
  label:string;
  description:string;
  user:{
    id:string;
    name:string;
    email:string;
    roles:Role[];
    requesterProfileId:string;
    providerProfileId:string|null;
  };
};

const demoIssuedAt="2026-07-06T12:00:00.000Z";
const demoUpdatedAt="2026-07-06T12:00:00.000Z";

export const demoProfiles:DemoProfileOption[]=[
  {id:"requester-only",label:"Requester only",description:"Compra, busca y solicita sin perfil proveedor.",user:{id:"user_requester_demo",name:"Demo Requester",email:"requester@demo.test",roles:["REQUESTER"],requesterProfileId:"requester_demo_001",providerProfileId:null}},
  {id:"provider-draft",label:"Provider draft",description:"Proveedor editable, todavía no público.",user:{id:"user_provider_draft_demo",name:"Demo Provider Draft",email:"provider-draft@demo.test",roles:["REQUESTER","PROVIDER"],requesterProfileId:"requester_demo_002",providerProfileId:"provider_draft_demo"}},
  {id:"active-provider",label:"Active provider",description:"Proveedor activo con catálogo y solicitudes.",user:{id:"user_provider_active_demo",name:"Demo Active Provider",email:"provider-active@demo.test",roles:["REQUESTER","PROVIDER"],requesterProfileId:"requester_demo_003",providerProfileId:"provider_active_demo"}},
  {id:"suspended-provider",label:"Suspended provider",description:"Proveedor restringido para revisar estados bloqueados.",user:{id:"user_provider_suspended_demo",name:"Demo Suspended Provider",email:"provider-suspended@demo.test",roles:["REQUESTER","PROVIDER"],requesterProfileId:"requester_demo_004",providerProfileId:"provider_suspended_demo"}},
  {id:"admin-reviewer",label:"Admin reviewer",description:"Puede revisar reportes, no asignar roles.",user:{id:"user_admin_reviewer_demo",name:"Demo Admin Reviewer",email:"admin-reviewer@demo.test",roles:["REQUESTER","ADMIN_REVIEWER"],requesterProfileId:"requester_demo_005",providerProfileId:null}},
  {id:"super-admin",label:"Super admin",description:"Acceso administrativo completo para validar guards.",user:{id:"user_super_admin_demo",name:"Demo Super Admin",email:"super-admin@demo.test",roles:["REQUESTER","SUPER_ADMIN"],requesterProfileId:"requester_demo_006",providerProfileId:null}},
];

export function createDemoAuthUser(option:DemoProfileOption):AuthUser {
  const provider=demoProviders.find(item=>item.id===option.user.providerProfileId);
  const isAdmin=option.user.roles.includes("ADMIN_REVIEWER")||option.user.roles.includes("SUPER_ADMIN");
  const isProvider=option.user.roles.includes("PROVIDER");
  return {
    id:option.user.id,
    email:option.user.email,
    name:option.user.name,
    image:null,
    role:isAdmin?"ADMIN":isProvider?"PROVIDER":"USER",
    roleLabels:option.user.roles,
    requesterProfileId:option.user.requesterProfileId,
    providerProfileId:option.user.providerProfileId,
    profileState:provider?.profileStatus,
    emailVerified:demoIssuedAt,
    createdAt:demoIssuedAt,
    providers:provider?[{id:provider.id,displayName:provider.publicName,slug:provider.id,verified:provider.verificationLevel==="COMPLETE",formalizationStatus:provider.formalizationStatus}]:[],
  };
}

export const demoAccounts:UserAccount[]=demoProfiles.map(option=>({
  id:option.user.id,
  email:option.user.email,
  displayName:option.user.name,
  status:"ACTIVE",
  emailVerifiedAt:demoIssuedAt,
  phoneVerifiedAt:option.user.roles.includes("PROVIDER")?demoIssuedAt:null,
  createdAt:demoIssuedAt,
  updatedAt:demoUpdatedAt,
}));

export const demoClientProfiles:ClientProfile[]=demoProfiles.map(option=>({
  id:option.user.requesterProfileId,
  userId:option.user.id,
  publicName:option.user.name,
  city:"Managua",
  avatarUrl:null,
  createdAt:demoIssuedAt,
  updatedAt:demoUpdatedAt,
}));

export const demoRoleAssignments:RoleAssignment[]=demoProfiles.flatMap(option=>option.user.roles.map((role,index)=>({
  id:`demo-role-${option.id}-${index+1}`,
  userId:option.user.id,
  role,
  grantedAt:demoIssuedAt,
  grantedByUserId:null,
})));

const demoImage="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80";

export const demoProviders:ProviderProfile[]=[
  {
    id:"provider_draft_demo",ownerUserId:"user_provider_draft_demo",publicName:"Demo Taller en Borrador",tagline:"Perfil en preparación para validar edición.",city:"Managua",category:"Diseño gráfico",description:"Perfil incompleto para probar edición, checklist y publicación posterior sin aparecer como proveedor activo.",serviceArea:["Managua"],services:["Identidad visual"],priceRange:"NEGOTIABLE",availability:"UNAVAILABLE",portfolioImages:[demoImage],formalizationStatus:"INFORMAL",verificationLevel:"PHONE",trustScore:0,medals:["Borrador"],responseTimeHrs:0,completedRequests:0,profileCompleteness:38,lat:12.134,lng:-86.255,contactPreference:"Mensajes de la plataforma",createdAt:demoIssuedAt,updatedAt:demoUpdatedAt,profileStatus:"DRAFT",avgRating:null,totalVerifiedReviews:0,
  },
  {
    id:"provider_active_demo",ownerUserId:"user_provider_active_demo",publicName:"Demo Proveedor Activo",tagline:"Proveedor listo para búsqueda, catálogo y solicitudes.",city:"Managua",category:"Servicios tecnológicos",description:"Proveedor activo para validar dashboard, catálogo, solicitudes recibidas, solicitudes enviadas y confianza visible pero no editable.",serviceArea:["Managua","Masaya"],services:["Sitios web","Automatización","Soporte técnico"],priceRange:"MEDIUM",availability:"AVAILABLE",portfolioImages:[demoImage],formalizationStatus:"IN_PROGRESS",verificationLevel:"COMPLETE",trustScore:88,medals:["Perfil completo","Teléfono verificado","Confianza alta"],responseTimeHrs:3,completedRequests:12,profileCompleteness:100,lat:12.128,lng:-86.248,contactPreference:"Mensajes de la plataforma",createdAt:demoIssuedAt,updatedAt:demoUpdatedAt,profileStatus:"ACTIVE",avgRating:4.8,totalVerifiedReviews:9,
  },
  {
    id:"provider_suspended_demo",ownerUserId:"user_provider_suspended_demo",publicName:"Demo Proveedor Suspendido",tagline:"Estado restringido para pruebas manuales.",city:"León",category:"Marketing digital",description:"Perfil suspendido para validar que la UI indique restricciones y no lo trate como proveedor activo normal.",serviceArea:["León"],services:["Campañas","Contenido"],priceRange:"LOW",availability:"UNAVAILABLE",portfolioImages:[demoImage],formalizationStatus:"INFORMAL",verificationLevel:"UNVERIFIED",trustScore:18,medals:["Revisión requerida"],responseTimeHrs:72,completedRequests:1,profileCompleteness:62,lat:12.433,lng:-86.878,contactPreference:"Mensajes de la plataforma",createdAt:demoIssuedAt,updatedAt:demoUpdatedAt,profileStatus:"SUSPENDED",avgRating:2.1,totalVerifiedReviews:2,suspiciousActivityPenalty:45,
  },
  {
    id:"provider_high_trust_demo",ownerUserId:"user_provider_active_demo",publicName:"Demo Alta Confianza",tagline:"Perfil activo con señales fuertes.",city:"Granada",category:"Empaques ecológicos",description:"Proveedor demo de alta confianza para comparar señales de reputación y actividad bilateral completada.",serviceArea:["Granada","Managua"],services:["Cajas reciclables","Etiquetas biodegradables"],priceRange:"HIGH",availability:"AVAILABLE",portfolioImages:[demoImage],formalizationStatus:"MIPYME",verificationLevel:"COMPLETE",trustScore:96,medals:["Perfil completo","MIPYME formal","Confianza alta"],responseTimeHrs:1,completedRequests:32,profileCompleteness:100,lat:11.936,lng:-85.958,contactPreference:"Mensajes de la plataforma",createdAt:demoIssuedAt,updatedAt:demoUpdatedAt,profileStatus:"ACTIVE",avgRating:4.9,totalVerifiedReviews:24,
  },
  {
    id:"provider_low_trust_demo",ownerUserId:"user_provider_active_demo",publicName:"Demo Confianza Baja",tagline:"Perfil activo con poca evidencia.",city:"Masaya",category:"Bordado y serigrafía",description:"Proveedor demo con baja confianza para revisar etiquetas, filtros y explicación de señales incompletas.",serviceArea:["Masaya"],services:["Camisetas bordadas"],priceRange:"LOW",availability:"BUSY",portfolioImages:[demoImage],formalizationStatus:"INFORMAL",verificationLevel:"PHONE",trustScore:34,medals:["Teléfono verificado"],responseTimeHrs:36,completedRequests:1,profileCompleteness:72,lat:11.976,lng:-86.096,contactPreference:"Mensajes de la plataforma",createdAt:demoIssuedAt,updatedAt:demoUpdatedAt,profileStatus:"ACTIVE",avgRating:3.2,totalVerifiedReviews:1,
  },
  {
    id:"provider_suspicious_penalty_demo",ownerUserId:"user_provider_active_demo",publicName:"Demo Penalización de Riesgo",tagline:"Perfil activo con penalización agregada.",city:"Estelí",category:"Café y alimentos",description:"Proveedor demo para validar cómo se muestra una confianza afectada por señales de riesgo sin exponer datos personales.",serviceArea:["Estelí"],services:["Café tostado","Entrega local"],priceRange:"MEDIUM",availability:"AVAILABLE",portfolioImages:[demoImage],formalizationStatus:"IN_PROGRESS",verificationLevel:"COMPLETE",trustScore:41,medals:["Perfil completo","Revisión manual"],responseTimeHrs:2,completedRequests:18,profileCompleteness:96,lat:13.092,lng:-86.352,contactPreference:"Mensajes de la plataforma",createdAt:demoIssuedAt,updatedAt:demoUpdatedAt,profileStatus:"ACTIVE",avgRating:4.7,totalVerifiedReviews:16,suspiciousActivityPenalty:38,
  },
];

export const demoOffers:ProviderOffer[]=demoProviders.flatMap((provider,index)=>[
  {
    id:`demo-offer-${provider.id}-1`,
    providerId:provider.id,
    type:index%2===0?"SERVICE":"PRODUCT",
    status:provider.profileStatus==="SUSPENDED"?"INACTIVE":"ACTIVE",
    name:`Oferta principal de ${provider.publicName}`,
    category:provider.category,
    shortDescription:"Oferta demo para validar búsqueda, catálogo y solicitudes.",
    fullDescription:"Oferta temporal de desarrollo. No representa inventario real ni lógica de autenticación.",
    priceType:"FROM",
    priceLabel:index%2===0?"Desde C$1,200":"Desde C$650",
    estimatedDelivery:"5 a 7 días",
    availability:provider.availability,
    cityCoverage:provider.serviceArea,
    tags:[provider.category,provider.city,"demo"],
    imageUrls:provider.portfolioImages,
    viewCount:20+index,
    inquiryCount:provider.profileStatus==="ACTIVE"?4+index:0,
    createdAt:demoIssuedAt,
    updatedAt:demoUpdatedAt,
  },
]);
