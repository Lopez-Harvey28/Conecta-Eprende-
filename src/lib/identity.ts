export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type Role = "REQUESTER" | "PROVIDER" | "ADMIN_REVIEWER" | "SUPER_ADMIN";
export type SystemRole = Role;

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
