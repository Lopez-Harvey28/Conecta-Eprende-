export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";
export type Role = "REQUESTER" | "PROVIDER" | "ADMIN_REVIEWER" | "SUPER_ADMIN";
export type SystemRole = Role;
export type ProviderProfileStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "TEMPORARILY_RESTRICTED";

export const ROLE_LABELS: Record<Role, string> = {
  REQUESTER: "Solicitante",
  PROVIDER: "Proveedor",
  ADMIN_REVIEWER: "Admin reviewer",
  SUPER_ADMIN: "Super admin",
};

export const PROVIDER_STATUS_LABELS: Record<ProviderProfileStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  SUSPENDED: "Suspendido",
  BANNED: "Baneado",
  TEMPORARILY_RESTRICTED: "Restringido temporalmente",
};

export const PROVIDER_STATUS_MEANING: Record<ProviderProfileStatus, string> = {
  DRAFT: "Perfil editable que todavía no debe aparecer como proveedor público normal.",
  ACTIVE: "Puede aparecer en búsqueda y recibir solicitudes.",
  INACTIVE: "No se presenta como opción activa hasta reactivarse.",
  SUSPENDED: "No puede recibir nuevas solicitudes mientras dura la restricción.",
  BANNED: "No puede operar ni recibir solicitudes.",
  TEMPORARILY_RESTRICTED: "Opera con restricciones y debe mostrar razón o fecha de fin cuando exista.",
};

export function getRoleLabel(roles: Array<string | null | undefined>): string {
  if (roles.includes("SUPER_ADMIN")) return ROLE_LABELS.SUPER_ADMIN;
  if (roles.includes("ADMIN_REVIEWER") || roles.includes("ADMIN")) return ROLE_LABELS.ADMIN_REVIEWER;
  if (roles.includes("PROVIDER")) return ROLE_LABELS.PROVIDER;
  return ROLE_LABELS.REQUESTER;
}

export function getProviderStatusLabel(status?: string | null): string {
  const normalized = (status || "ACTIVE") as ProviderProfileStatus;
  return PROVIDER_STATUS_LABELS[normalized] || status || PROVIDER_STATUS_LABELS.ACTIVE;
}

export interface UserAccount {
  id:string;
  email:string;
  displayName:string;
  status:AccountStatus;
  emailVerifiedAt:string|null;
  phoneVerifiedAt:string|null;
  createdAt:string;
  updatedAt:string;
}

export interface ClientProfile {
  id:string;
  userId:string;
  publicName:string;
  city:string|null;
  avatarUrl:string|null;
  createdAt:string;
  updatedAt:string;
}

export interface RoleAssignment {
  id:string;
  userId:string;
  role:SystemRole;
  grantedAt:string;
  grantedByUserId:string|null;
}

export type User = {
  id:string;
  name:string;
  email:string;
  roles:Role[];
  requesterProfileId?:string;
  providerProfileId?:string;
  accountStatus?:"ACTIVE"|"SUSPENDED";
  createdAt?:string;
};

export type RequesterProfile = {
  id:string;
  userId:string;
  displayName:string;
  city?:string;
  avatarUrl?:string;
  createdAt?:string;
  updatedAt?:string;
};

export type CatalogItem = {
  id:string;
  providerProfileId:string;
  name:string;
  type:"PRODUCT"|"SERVICE"|"SUPPLY"|"RAW_MATERIAL"|"PRODUCTIVE_EQUIPMENT"|"EQUIPMENT_RENTAL"|"REPAIR"|"MAINTENANCE"|"TRAINING";
  category:string;
  subcategory?:string;
  description:string;
  minPrice?:number;
  maxPrice?:number;
  currency?:"NIO"|"USD";
  unit?:string;
  city?:string;
  available:boolean;
  imageUrl?:string;
};

export type ProviderRequestStatus = "OPEN"|"IN_CONVERSATION"|"CLOSED_BY_REQUESTER"|"CLOSED_BY_PROVIDER"|"COMPLETED_PENDING_CONFIRMATION"|"COMPLETED"|"CANCELLED"|"REPORTED";

export type ProviderRequest = {
  id:string;
  requesterUserId:string;
  requesterProfileId?:string;
  requesterProviderProfileId?:string|null;
  targetProviderProfileId:string;
  catalogItemId?:string|null;
  title:string;
  description:string;
  status:ProviderRequestStatus;
  budgetEstimate?:number|null;
  requestedDate?:string|null;
  confirmedByRequesterAt?:string|null;
  confirmedByProviderAt?:string|null;
  completedAt?:string|null;
  createdAt:string;
  updatedAt?:string;
};

export type VerifiedReview = {
  id:string;
  requestId:string;
  reviewerUserId:string;
  reviewedProviderProfileId:string;
  score:number;
  text?:string;
  createdAt:string;
};

export type RiskReport = {
  id:string;
  providerProfileId:string;
  riskScore:number;
  suspiciousCyclesCount:number;
  avgSearchTimeSeconds?:number;
  avgRequestToCompletionMinutes?:number;
  avgMessagesPerRequest?:number;
  newAccountsPercentage?:number;
  ratingConcentrationScore?:number;
  generatedAt:string;
  status:"PENDING"|"REVIEWED"|"DISMISSED"|"CONFIRMED";
  recommendedAction:string;
};

/** Returned by the real login/session endpoint. Never persisted with domain data. */
export interface AuthSessionDTO {
  sessionId:string;
  userId:string;
  systemRoles:SystemRole[];
  issuedAt:string;
  expiresAt:string;
}

export interface SerializedIdentityData {
  schemaVersion:1;
  accounts:UserAccount[];
  clientProfiles:ClientProfile[];
  roleAssignments:RoleAssignment[];
}

export const hasSystemRole=(session:AuthSessionDTO|null,role:SystemRole)=>!!session?.systemRoles.includes(role);

export function serializeIdentityData(data:Omit<SerializedIdentityData,"schemaVersion">):SerializedIdentityData {
  return {schemaVersion:1,accounts:data.accounts,clientProfiles:data.clientProfiles,roleAssignments:data.roleAssignments};
}

export function parseIdentityData(value:unknown):SerializedIdentityData {
  if(!value||typeof value!=="object")throw new Error("El paquete de identidad no es válido.");
  const data=value as Partial<SerializedIdentityData>;
  if(data.schemaVersion!==1||!Array.isArray(data.accounts)||!Array.isArray(data.clientProfiles)||!Array.isArray(data.roleAssignments))throw new Error("La versión del paquete de identidad no es compatible.");
  return data as SerializedIdentityData;
}
