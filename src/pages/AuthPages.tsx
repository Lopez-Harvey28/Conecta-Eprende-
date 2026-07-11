import { Link, useSearchParams } from "react-router-dom";
import { LogIn, ShieldAlert } from "lucide-react";
import { EmptyState, PageHeader } from "../components/mvp/Ui";
import { useAuthStore } from "../stores/auth-store";

export function LoginPage(){const [params]=useSearchParams();const error=useAuthStore(state=>state.error);return <div className="narrow-page"><PageHeader eyebrow="Acceso seguro" title="Iniciá sesión para continuar" description="La aplicación espera una sesión emitida por el servicio de autenticación."/><section className="content-section"><h2><LogIn/> Punto de integración de login</h2><p>Después de autenticar credenciales, el backend debe crear una cookie de sesión segura y responder el contrato de <code>/api/auth/session</code>. La interfaz no inventa usuarios ni cambia roles localmente.</p>{params.get("next")&&<p className="form-note">Al iniciar sesión, continuá hacia: {params.get("next")}</p>}{error&&<p className="field-error">{error}</p>}</section><Link className="button secondary" to="/">Volver al inicio</Link></div>}
export function UnauthorizedPage(){return <div className="content-page"><EmptyState icon={<ShieldAlert/>} title="No autorizado">Tu cuenta no tiene permisos para abrir esta sección.</EmptyState></div>}
