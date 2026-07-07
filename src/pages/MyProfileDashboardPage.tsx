import { Link } from "react-router-dom";
import { Award, BadgeCheck, BriefcaseBusiness, Check, Circle, ExternalLink, MessageCircle, Package, Plus, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useAuthStore } from "../stores/auth-store";
import { useProvidersStore } from "../stores/providers-store";
import { useQuotesStore } from "../stores/quotes-store";
import { FormalizationBadge, PageHeader, SkeletonRows, TrustBadge, UnavailableForMvpCard, VerificationBadge } from "../components/mvp/Ui";
import { useEffect } from "react";

export default function MyProfileDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { currentProvider, getProvider, isLoading: providerLoading } = useProvidersStore();
  const { threads, fetchThreadsByProvider } = useQuotesStore();

  const providerId = user?.providers?.[0]?.id;
  const provider = currentProvider?.provider;

  useEffect(() => {
    if (providerId) {
      getProvider(providerId);
    }
  }, [providerId, getProvider]);

  useEffect(() => {
    if (providerId) {
      fetchThreadsByProvider(providerId);
    }
  }, [providerId, fetchThreadsByProvider]);

  if (authLoading || providerLoading) {
    return (
      <div className="content-page">
        <SkeletonRows count={4} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="content-page">
        <div className="empty-state">
          <h1>Iniciá sesión</h1>
          <p>Necesitás iniciar sesión para ver tu panel de negocio.</p>
          <Link to="/auth/login" className="button primary">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  if (!providerId || !provider) {
    return (
      <div className="content-page">
        <PageHeader
          eyebrow="Centro de negocio"
          title="Mi perfil"
          description="Gestioná tu presencia pública, catálogo, conversaciones y crecimiento de confianza."
        />
        <div className="empty-state">
          <BriefcaseBusiness size={48} />
          <h1>Completá tu registro de negocio</h1>
          <p>Aún no tenés un negocio registrado. Creá tu primer perfil para empezar a conectar con clientes.</p>
          <Link to="/me/profile/edit" className="button primary">
            <Plus /> Crear mi negocio
          </Link>
        </div>
      </div>
    );
  }

  const catalogItems = currentProvider?.catalogItems || [];
  const activeItems = catalogItems.filter((item: any) => item.availabilityStatus === "DISPONIBLE");
  const inactiveItems = catalogItems.filter((item: any) => item.availabilityStatus !== "DISPONIBLE");
  const mostConsulted = [...catalogItems].sort((a: any, b: any) => b.inquiryCount - a.inquiryCount)[0];

  const openThreads = threads.filter(t => t.status === "OPEN" || t.status === "IN_CONVERSATION" || t.status === "QUOTE_SENT" || t.status === "QUOTE_ACCEPTED");
  const completedThreads = threads.filter(t => t.status === "COMPLETED");

  const portfolioImages = currentProvider?.photos?.map((p: any) => p.imageUrl).filter(Boolean) || [];
  const trustScore = currentProvider?.provider?.trustScore?.finalScore ?? provider.trustScore ?? 0;
  const medals = currentProvider?.medals || [];

  const checklist = [
    { label: "Nombre público", done: !!provider.displayName },
    { label: "Ciudad creativa", done: !!provider.city },
    { label: "Categoría principal", done: !!provider.category },
    { label: "Descripción completa", done: (provider.aboutDescription || "").length >= 40 },
    { label: "Producto o servicio activo", done: activeItems.length > 0 },
    { label: "Imagen o portafolio", done: portfolioImages.length > 0 },
    { label: "Rango de precio", done: !!provider.priceRange },
    { label: "Disponibilidad", done: !!provider.availability },
  ];

  const completeness = Math.round(checklist.filter(item => item.done).length / checklist.length * 100);

  const displayName = user.name || user.email?.split("@")[0] || "Usuario";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="content-page">
      <PageHeader
        eyebrow="Centro de negocio"
        title="Mi perfil"
        description="Gestioná tu presencia pública, catálogo, conversaciones y crecimiento de confianza."
        actions={
          <div className="page-actions">
            <Link className="button secondary" to={`/providers/${provider.id}`}>
              Ver perfil público <ExternalLink />
            </Link>
            <Link className="button primary" to="/me/profile/edit">
              Editar perfil público
            </Link>
          </div>
        }
      />

      <section className="account-summary">
        <div className="profile-monogram">{initials}</div>
        <div>
          <h2>{user.name || "Usuario"}</h2>
          <p>{user.email}</p>
          <div className="badges">
            <span className="badge"><Smartphone /> Teléfono verificado</span>
            <span className="badge"><UserRound /> {user.role}</span>
            <span className="badge">Cuenta activa</span>
          </div>
        </div>
      </section>

      <div className="profile-dashboard">
        <main>
          <section className="profile-preview">
            <div
              className="preview-image"
              style={{ backgroundImage: `url(${portfolioImages[0] || provider.coverImageUrl || ""})` }}
            />
            <div>
              <span className="eyebrow">Vista previa pública</span>
              <h2>{provider.displayName}</h2>
              <p>{provider.aboutDescription || provider.shortDescription}</p>
              <div className="badges">
                <TrustBadge score={trustScore} />
                <VerificationBadge level={provider.verificationLevel} />
                <FormalizationBadge status={provider.formalizationStatus} />
              </div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Fortaleza del perfil</span>
                <h2>{completeness}% completo</h2>
              </div>
              <strong>{checklist.filter(item => item.done).length}/{checklist.length}</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${completeness}%` }} />
            </div>
            <div className="profile-checklist">
              {checklist.map(item => (
                <div className={item.done ? "done" : ""} key={item.label}>
                  {item.done ? <Check /> : <Circle />}
                  {item.label}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Catálogo</span>
                <h2>Productos y servicios</h2>
              </div>
              <Package />
            </div>
            <div className="business-metrics">
              <div>
                <strong>{activeItems.length}</strong>
                <span>Activos</span>
              </div>
              <div>
                <strong>{inactiveItems.length}</strong>
                <span>Inactivos</span>
              </div>
              <div>
                <strong>{mostConsulted?.title || "Sin datos"}</strong>
                <span>Más consultado</span>
              </div>
            </div>
            <div className="card-actions">
              <Link className="button secondary" to="/me/products">
                Administrar productos y servicios
              </Link>
              <Link className="button primary" to="/me/products/new">
                <Plus /> Agregar oferta
              </Link>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Actividad comercial</span>
                <h2>Conversaciones y solicitudes</h2>
              </div>
              <MessageCircle />
            </div>
            <div className="business-metrics">
              <div>
                <strong>{openThreads.length}</strong>
                <span>Mensajes no leídos</span>
              </div>
              <div>
                <strong>{openThreads.length}</strong>
                <span>Solicitudes activas</span>
              </div>
              <div>
                <strong>{completedThreads.length}</strong>
                <span>Completadas</span>
              </div>
            </div>
            <div className="card-actions">
              <Link className="button primary" to="/requests">Ver conversaciones</Link>
              <Link className="button secondary" to="/requests">Ver solicitudes</Link>
            </div>
          </section>

          <UnavailableForMvpCard title="Importar y exportar no disponible para el MVP" />
        </main>

        <aside>
          <section className="content-section">
            <h2><ShieldCheck /> Confianza y medallas</h2>
            <strong className="big-score">{trustScore}<small>/100</small></strong>
            <p>Respondé dentro de la app, completá trabajos con confirmación bilateral y mantené actualizado tu catálogo.</p>
            <div className="medal-list">
              {medals.map((medal: any) => (
                <span key={medal.id}><Award />{medal.medalType}</span>
              ))}
              {activeItems.length < 3 && (
                <span className="locked">
                  <Package /> Catálogo activo: faltan {3 - activeItems.length}
                </span>
              )}
            </div>
            <Link className="text-link" to="/trust">Entender mi puntaje</Link>
          </section>

          <section className="content-section">
            <h2><BriefcaseBusiness /> Formalización</h2>
            <FormalizationBadge status={provider.formalizationStatus} />
            <p>Continuá la guía para organizar tus documentos y próximos pasos.</p>
            <Link className="button secondary full" to="/formalization">Continuar guía</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}