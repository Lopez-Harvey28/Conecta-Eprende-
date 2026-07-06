import { useAuthStore } from "../stores/auth-store";
import { useMvpStore } from "../stores/mvp-store";

export function useCurrentUser(){
  const session=useAuthStore(state=>state.session);const account=useMvpStore(state=>state.accounts.find(item=>item.id===session?.userId));const provider=useMvpStore(state=>state.providers.find(item=>item.ownerUserId===session?.userId));const clientProfile=useMvpStore(state=>state.clientProfiles.find(item=>item.userId===session?.userId));
  if(!session||!account)return{authenticated:false as const,id:"",name:"",email:"",providerId:null,clientProfileId:null,phoneVerified:false,isAdmin:false,role:"ANONYMOUS" as const,systemRoles:[]};
  const isAdmin=session.systemRoles.includes("SUPER_ADMIN")||session.systemRoles.includes("ADMIN_REVIEWER");
  return{authenticated:true as const,id:account.id,name:account.displayName,email:account.email,providerId:provider?.id??null,clientProfileId:clientProfile?.id??null,phoneVerified:!!account.phoneVerifiedAt,isAdmin,role:isAdmin?"ADMIN" as const:provider?"PROVIDER" as const:"CLIENT" as const,systemRoles:session.systemRoles};
}

export function useAuthenticatedUser(){const user=useCurrentUser();if(!user.authenticated)throw new Error("La ruta protegida se renderizó sin una sesión válida.");return user}
