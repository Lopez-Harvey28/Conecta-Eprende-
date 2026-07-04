import { useState } from "react";
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert, XCircle } from "lucide-react";
import { useMvpStore } from "../stores/mvp-store";
import { EmptyState, PageHeader } from "../components/mvp/Ui";
import type { Report } from "../lib/mvp-data";
import { useAuthenticatedUser } from "../hooks/use-current-user";

const reportLabels:Record<Report["status"],string>={PENDING:"Pendiente",REVIEWED:"Revisado",DISMISSED:"Descartado",ESCALATED:"Escalado"};

export default function AdminReportsPage(){
  const current=useAuthenticatedUser();const reports=useMvpStore(state=>state.reports);const providers=useMvpStore(state=>state.providers);const update=useMvpStore(state=>state.updateReport);const [filter,setFilter]=useState<Report["status"]|"">("PENDING");
  if(!current.isAdmin)return <div className="content-page"><EmptyState icon={<ShieldAlert/>} title="No autorizado">Tu cuenta no tiene permisos administrativos.</EmptyState></div>;
  const list=reports.filter(report=>!filter||report.status===filter);
  return <div className="content-page"><PageHeader eyebrow="Administración" title="Revisión de reportes" description="Cada caso requiere criterio humano. Ningún reporte sanciona una cuenta automáticamente." actions={<label>Estado<select value={filter} onChange={event=>setFilter(event.target.value as Report["status"]|"")}><option value="">Todos</option>{Object.entries(reportLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>}/>{list.length?<div className="report-table">{list.map(report=><article key={report.id}><div className="report-icon"><Flag/></div><div><div className="report-meta"><span className="status">{reportLabels[report.status]}</span><time>{new Date(report.createdAt).toLocaleDateString("es-NI",{day:"2-digit",month:"2-digit",year:"numeric"})}</time></div><h2>{report.reason}</h2><p>{report.description}</p><small>Relacionado con: {providers.find(provider=>provider.id===report.targetId)?.publicName||"Conversación reportada"}</small></div>{report.status==="PENDING"?<div className="report-actions"><button className="button secondary" onClick={()=>update(report.id,"DISMISSED")}><XCircle/> Descartar</button><button className="button secondary" onClick={()=>update(report.id,"ESCALATED")}><AlertTriangle/> Escalar</button><button className="button primary" onClick={()=>update(report.id,"REVIEWED")}><CheckCircle2/> Marcar revisado</button></div>:<p className="form-note">Caso {reportLabels[report.status].toLowerCase()}. No hay acciones pendientes.</p>}</article>)}</div>:<EmptyState title="No hay reportes en este estado">Cambiá el filtro para consultar otros casos.</EmptyState>}</div>;
}
