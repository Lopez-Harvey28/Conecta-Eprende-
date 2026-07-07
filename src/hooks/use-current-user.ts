import { useAuthStore } from "../stores/auth-store";
import { useMvpStore } from "../stores/mvp-store";
import type { Role } from "../lib/identity";

export function useCurrentUser(){
  const authUser=useAuthStore(state=>state.user);
  const account=useMvpStore(state=>state.accounts.find(item=>item.id===authUser?.id));
  const provider=useMvpStore(state=>state.providers.find(item=>item.id===authUser?.providerProfileId||item.ownerUserId===authUser?.id));
  const clientProfile=useMvpStore(state=>state.clientProfiles.find(item=>item.id===authUser?.requesterProfileId||item.userId===authUser?.id));
  if(!authUser)return{authenticated:false as const,id:"",name:"",email:"",providerId:null,clientProfileId:null,phoneVerified:false,isAdmin:false,role:"ANONYMOUS" as const,systemRoles:[] as Role[]};
  const systemRoles=(authUser.roleLabels??[authUser.role]) as Role[];
  const isAdmin=authUser.role==="ADMIN"||systemRoles.includes("SUPER_ADMIN")||systemRoles.includes("ADMIN_REVIEWER");
  const providerId=provider?.id??authUser.providerProfileId??authUser.providers[0]?.id??null;
  return{authenticated:true as const,id:authUser.id,name:account?.displayName??authUser.name??authUser.email,email:account?.email??authUser.email,providerId,clientProfileId:clientProfile?.id??authUser.requesterProfileId??null,phoneVerified:!!account?.phoneVerifiedAt||!!authUser.emailVerified,isAdmin,role:isAdmin?"ADMIN" as const:providerId||authUser.role==="PROVIDER"?"PROVIDER" as const:"CLIENT" as const,systemRoles};
}

export function useAuthenticatedUser(){const user=useCurrentUser();if(!user.authenticated)throw new Error("La ruta protegida se renderizó sin una sesión válida.");return user}
