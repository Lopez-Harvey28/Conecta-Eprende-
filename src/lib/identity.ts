export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type SystemRole = "USER" | "MODERATOR" | "ADMIN";

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
