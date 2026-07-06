import { create } from "zustand";
import type { AuthSessionDTO } from "../lib/identity";

type AuthStatus="IDLE"|"LOADING"|"AUTHENTICATED"|"UNAUTHENTICATED";
const bootstrapAdminEnabled=import.meta.env?.VITE_BOOTSTRAP_ADMIN!=="false";
interface AuthState {
  status:AuthStatus;
  session:AuthSessionDTO|null;
  error:string|null;
  refreshSession:()=>Promise<void>;
  establishSession:(session:AuthSessionDTO)=>void;
  clearSession:()=>void;
}

function createBootstrapAdminSession():AuthSessionDTO {
  const issuedAt=new Date();
  return{sessionId:"bootstrap-admin-session",userId:"user-provider",systemRoles:["REQUESTER","PROVIDER","ADMIN_REVIEWER","SUPER_ADMIN"],issuedAt:issuedAt.toISOString(),expiresAt:new Date(issuedAt.getTime()+8*60*60*1000).toISOString()};
}

function isSession(value:unknown):value is AuthSessionDTO {
  if(!value||typeof value!=="object")return false;
  const session=value as Partial<AuthSessionDTO>;
  return typeof session.sessionId==="string"&&typeof session.userId==="string"&&Array.isArray(session.systemRoles)&&typeof session.issuedAt==="string"&&typeof session.expiresAt==="string";
}

export const useAuthStore=create<AuthState>((set)=>({
  status:"IDLE",session:null,error:null,
  refreshSession:async()=>{
    set({status:"LOADING",error:null});
    try{
      const response=await fetch("/api/auth/session",{credentials:"include",headers:{Accept:"application/json"}});
      if(response.status===401||response.status===404){set(bootstrapAdminEnabled?{status:"AUTHENTICATED",session:createBootstrapAdminSession(),error:null}:{status:"UNAUTHENTICATED",session:null,error:null});return;}
      if(!response.ok)throw new Error("No pudimos verificar tu sesión.");
      const payload:unknown=await response.json();
      if(!isSession(payload))throw new Error("La sesión recibida no tiene el formato esperado.");
      if(new Date(payload.expiresAt).getTime()<=Date.now()){set({status:"UNAUTHENTICATED",session:null});return;}
      set({status:"AUTHENTICATED",session:payload,error:null});
    }catch(error){set({status:"UNAUTHENTICATED",session:null,error:error instanceof Error?error.message:"No pudimos verificar tu sesión."});}
  },
  establishSession:session=>set({status:"AUTHENTICATED",session,error:null}),
  clearSession:()=>set({status:"UNAUTHENTICATED",session:null,error:null}),
}));
