import { useState } from "react";
import { Building2, CheckCircle2, Circle, FileCheck2, GraduationCap, Landmark, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../stores/auth-store";
import { useProvidersStore } from "../stores/providers-store";
import { PageHeader } from "../components/mvp/Ui";
import { useEffect } from "react";

const defaultSteps = [
  { id: "actividad", title: "Definir actividad económica", detail: "Describí qué vendés o qué servicio prestás.", done: false },
  { id: "identificacion", title: "Preparar identificación y domicilio", detail: "Reuní cédula y comprobante de domicilio.", done: false },
  { id: "tributario", title: "Revisar inscripción tributaria", detail: "Consultá requisitos vigentes directamente con DGI.", done: false },
  { id: "mipyme", title: "Preparar registro MIPYME", detail: "Organizá la información solicitada por MIFIC.", done: false },
];

const formalizationOptions: Record<string, string> = {
  INFORMAL: "Informal",
  EN_PROCESO: "En proceso",
  MIPYME_FORMAL: "MIPYME formal",
  DOCUMENTOS_PENDIENTES: "Documentos pendientes",
};

export default function FormalizationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { currentProvider, getProvider } = useProvidersStore();

  const provider = currentProvider?.provider;
  const providerId = user?.providers?.[0]?.id;

  useEffect(() => {
    if (providerId) {
      getProvider(providerId);
    }
  }, [providerId, getProvider]);

  const [steps, setSteps] = useState(defaultSteps);

  const handleStatusChange = async (newStatus: string) => {
    if (!providerId) return;
    try {
      await fetch(`/api/providers/${providerId}/formalization`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await getProvider(providerId);
    } catch (e) {
      console.error("Update formalization status error:", e);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="content-page">
        <div className="empty-state">
          <h1>Iniciá sesión</h1>
          <p>Necesitás iniciar sesión para ver tu guía de formalización.</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="content-page">
        <PageHeader
          eyebrow="Guía de preparación"
          title="Tu ruta de formalización"
          description="Organizá los próximos pasos."
        />
        <div className="empty-state">
          <h2>Sin negocio registrado</h2>
          <p>Primero creá tu perfil de negocio para acceder a la guía de formalización.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      <PageHeader
        eyebrow="Guía de preparación"
        title="Tu ruta de formalización"
        description="Organizá los próximos pasos. Esta guía no reemplaza la orientación oficial ni se conecta con sistemas gubernamentales."
        actions={
          <select
            className="status-select"
            value={provider.formalizationStatus || "INFORMAL"}
            onChange={e => handleStatusChange(e.target.value)}
          >
            <option value="INFORMAL">Informal</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="MIPYME_FORMAL">MIPYME formal</option>
            <option value="DOCUMENTOS_PENDIENTES">Documentos pendientes</option>
          </select>
        }
      />

      <div className="formalization-grid">
        <main>
          <section className="content-section">
            <div className="section-heading">
              <h2>Checklist de preparación</h2>
              <span>{steps.filter(s => s.done).length} de {steps.length} completados</span>
            </div>
            <div className="progress">
              <span style={{ width: `${steps.filter(s => s.done).length / steps.length * 100}%` }} />
            </div>
            <div className="step-list">
              {steps.map((step, i) => (
                <button
                  key={step.id}
                  onClick={() => setSteps(items => items.map((s, n) => n === i ? { ...s, done: !s.done } : s))}
                >
                  <span className={step.done ? "done" : ""}>
                    {step.done ? <CheckCircle2 /> : <Circle />}
                  </span>
                  <span>
                    <strong>{step.title}</strong>
                    {step.detail}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="content-section">
            <h2>Documentos para preparar</h2>
            <ul className="document-list">
              <li><FileCheck2 /> Cédula de identidad vigente</li>
              <li><FileCheck2 /> Comprobante de domicilio</li>
              <li><FileCheck2 /> Descripción de actividad económica</li>
              <li><FileCheck2 /> Información comercial y de contacto</li>
            </ul>
          </section>
        </main>

        <aside>
          <section className="content-section">
            <h2>Instituciones de referencia</h2>
            <div className="institution-list">
              <div>
                <Landmark />
                <span>
                  <strong>MIFIC</strong>
                  Registro y acompañamiento MIPYME.
                </span>
              </div>
              <div>
                <Building2 />
                <span>
                  <strong>DGI</strong>
                  Registro tributario y obligaciones fiscales.
                </span>
              </div>
              <div>
                <GraduationCap />
                <span>
                  <strong>INATEC</strong>
                  Formación técnica y capacitación.
                </span>
              </div>
            </div>
          </section>

          <section className="benefit-panel">
            <ShieldCheck />
            <h2>¿Qué puede aportar?</h2>
            <p>
              Más acceso a oportunidades, mejor organización y señales adicionales de confianza para clientes.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}