import type { ReactNode } from "react";
import { Award, BadgeCheck, BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { availabilityLabel, formalizationLabel, priceLabel, type Availability, type FormalizationStatus, type PriceRange, type RequestStatus, type VerificationLevel } from "../../lib/mvp-data";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?:string; title:string; description?:string; actions?:ReactNode }) {
  return <header className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>;
}
export function TrustBadge({ score }: { score:number }) { return <span className="badge badge-trust"><ShieldCheck size={15}/>{score} confianza</span>; }
export function VerificationBadge({ level }: { level:VerificationLevel }) { const label = {UNVERIFIED:"Sin verificar",PHONE:"Teléfono verificado",COMPLETE:"Perfil verificado"}[level]; return <span className="badge"><BadgeCheck size={15}/>{label}</span>; }
export function FormalizationBadge({ status }: { status:FormalizationStatus }) { return <span className={`badge formal-${status.toLowerCase()}`}><BriefcaseBusiness size={15}/>{formalizationLabel[status]}</span>; }
export function AvailabilityBadge({ value }: { value:Availability }) { return <span className="badge"><Clock3 size={15}/>{availabilityLabel[value]}</span>; }
export function PriceBadge({ value }: { value:PriceRange }) { return <span className="badge">C$ · {priceLabel[value]}</span>; }
export const statusLabel: Record<RequestStatus,string> = { DRAFT:"Borrador",OPEN:"Abierta",IN_CONVERSATION:"En conversación",QUOTE_SENT:"Cotización enviada",QUOTE_ACCEPTED:"Cotización aceptada",CLOSED_REQUESTER:"Cerrada por cliente",CLOSED_PROVIDER:"Cerrada por proveedor",COMPLETED:"Completada",CANCELLED:"Cancelada" };
export function RequestStatusBadge({ status }: { status:RequestStatus }) { return <span className={`status status-${status.toLowerCase()}`}>{status === "COMPLETED" && <CheckCircle2 size={14}/>} {statusLabel[status]}</span>; }
export function EmptyState({ icon, title, children, action }: { icon?:ReactNode; title:string; children:ReactNode; action?:ReactNode }) { return <div className="empty-state"><div className="empty-icon">{icon || <Award/>}</div><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function SkeletonRows({ count=3 }: { count?:number }) { return <div className="skeleton-list">{Array.from({length:count},(_,i)=><div className="skeleton-row" key={i}/>)}</div>; }
export function UnavailableForMvpCard({ title="No disponible para el MVP" }: { title?:string }) { return <section className="unavailable"><div className="unavailable-icon"><ShieldCheck/></div><div><h3>{title}</h3><p>Esta función está fuera del alcance del hackathon. La versión actual se enfoca en búsqueda, perfiles, cotizaciones, confianza y formalización.</p></div></section>; }
