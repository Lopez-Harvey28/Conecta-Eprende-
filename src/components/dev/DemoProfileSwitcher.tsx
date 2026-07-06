import { Link } from "react-router-dom";
import { FlaskConical, ShieldCheck, UserCog } from "lucide-react";
import { createDemoSession, demoProfiles } from "../../auth/demoProfiles";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useAuthStore } from "../../stores/auth-store";

const demoSwitcherEnabled=import.meta.env.VITE_ENABLE_DEMO_PROFILE_SWITCHER==="true";

const navLinks=[
  ["Requester","/requests/sent"],
  ["Provider","/provider/me"],
  ["Admin","/admin/risk-reports"],
  ["Search","/search"],
] as const;

export default function DemoProfileSwitcher(){
  const current=useCurrentUser();const establishSession=useAuthStore(state=>state.establishSession);const session=useAuthStore(state=>state.session);
  if(!demoSwitcherEnabled)return null;
  const selected=demoProfiles.find(option=>option.user.id===session?.userId)??demoProfiles.find(option=>option.user.id===current.id)??demoProfiles[0];
  const activate=(id:string)=>{const option=demoProfiles.find(item=>item.id===id);if(option)establishSession(createDemoSession(option))};
  return <aside className="demo-profile-switcher" aria-label="Developer demo profile switcher"><div className="demo-switcher-head"><span><FlaskConical/> Dev testing</span><strong>{selected.label}</strong></div><label>Perfil demo<select value={selected.id} onChange={event=>activate(event.target.value)}>{demoProfiles.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label><p>{selected.description}</p><dl><div><dt>Roles</dt><dd>{selected.user.roles.join(", ")}</dd></div><div><dt>Requester</dt><dd>{selected.user.requesterProfileId}</dd></div><div><dt>Provider</dt><dd>{selected.user.providerProfileId??"none"}</dd></div></dl><div className="demo-switcher-links">{navLinks.map(([label,to])=><Link key={to} to={to}>{label}</Link>)}</div><div className="demo-switcher-note"><ShieldCheck/> No es auth real. Backend sigue siendo autoridad.</div><div className="demo-switcher-note"><UserCog/> Desactivar antes de producción.</div></aside>;
}
