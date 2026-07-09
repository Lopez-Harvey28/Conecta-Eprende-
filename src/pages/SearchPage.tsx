import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarCheck, List, Map, MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import MvpProviderMap, { type SearchMapProvider } from "../components/map/MvpProviderMap";
import { CATEGORY_OPTIONS, CREATIVE_CITIES, type CreativeCity, type PriceRange } from "../lib/mvp-data";
import { useProvidersStore, type ProviderSearchResult } from "../stores/providers-store";
import { useAuthStore } from "../stores/auth-store";
import { AvailabilityBadge, EmptyState, PriceBadge, SkeletonRows, TrustBadge, VerificationBadge } from "../components/mvp/Ui";

const availabilityLabel: Record<string, string> = {
  DISPONIBLE: "Disponible",
  OCUPADO: "Ocupado",
  BAJO_PEDIDO: "Bajo pedido",
  NO_DISPONIBLE_TEMPORALMENTE: "No disponible temporalmente",
};

const priceLabel: Record<string, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  NEGOTIABLE: "A negociar",
};

const aliases: Record<string, string> = {
  empaque: "Empaques ecológicos",
  empaques: "Empaques ecológicos",
  logo: "Diseño gráfico",
  diseño: "Diseño gráfico",
  camiseta: "Bordado y serigrafía",
  bordada: "Bordado y serigrafía",
  café: "Café y alimentos",
  foto: "Fotografía",
  marketing: "Marketing digital",
  muebles: "Muebles y carpintería",
  web: "Servicios tecnológicos",
  agrícola: "Insumos agrícolas",
};

const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function extractIntent(query: string) {
  const normalized = norm(query);
  const city = CREATIVE_CITIES.find(item => normalized.includes(norm(item))) || null;
  const alias = Object.keys(aliases).find(item => normalized.includes(norm(item)));
  const category = alias ? aliases[alias] : null;
  const budget: PriceRange | null =
    /barato|economico|accesible/.test(normalized) ? "LOW" :
    /premium|exportacion|alta calidad/.test(normalized) ? "HIGH" :
    /profesional|calidad/.test(normalized) ? "MEDIUM" : null;
  return {
    city,
    category,
    budget,
    urgency: /urgente|hoy|rapido/.test(normalized) ? "URGENTE" : "NORMAL",
    keywords: normalized.split(/\s+/).filter(word => word.length > 3),
  };
}

export default function SearchPage() {
  const { providers, searchProviders, isLoading } = useProvidersStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("query") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [trust, setTrust] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const intent = useMemo(() => extractIntent(query), [query]);
  const ownedProviderId = user?.providers?.[0]?.id || user?.providerProfileId;

  useEffect(() => {
    searchProviders({ q: params.get("query") || undefined, city: params.get("city") || undefined });
  }, []);

  const results = useMemo(() => {
    return providers
      .map((provider: ProviderSearchResult) => {
        const cityTarget = (city || intent.city) as CreativeCity | null;
        const categoryTarget = category || intent.category;
        const text = norm(`${provider.displayName} ${provider.category} ${provider.shortDescription || ""}`);
        const keywordHit = !query || intent.keywords.some(keyword => text.includes(keyword)) || !!categoryTarget;
        const match = keywordHit &&
          (!cityTarget || provider.city === cityTarget) &&
          (!categoryTarget || norm(provider.category).includes(norm(categoryTarget))) &&
          (!price || provider.priceRange === price) &&
          provider.trustScore >= trust;

        const proximity = cityTarget ? (provider.city === cityTarget ? 100 : 25) : 70;
        const priceMatch = intent.budget ? (provider.priceRange === intent.budget ? 100 : 40) : 70;
        const availabilityScore = provider.status === "SUSPENDED" || provider.status === "BANNED"
          ? -100
          : provider.availability === "DISPONIBLE" ? 100 : provider.availability === "OCUPADO" ? 50 : 0;

        return {
          ...provider,
          match,
          rank: 0.35 * provider.trustScore + 0.25 * proximity + 0.20 * priceMatch + 0.20 * availabilityScore,
        };
      })
      .filter((provider: any) => provider.match)
      .sort((a: any, b: any) => b.rank - a.rank);
  }, [providers, query, city, category, price, trust, intent]);

  const mapProviders = useMemo<SearchMapProvider[]>(() => {
    return results.map((provider: any) => ({
      id: provider.id,
      publicName: provider.displayName,
      category: provider.category,
      city: provider.city,
      lat: provider.lat,
      lng: provider.lng,
      trustScore: provider.trustScore,
      availabilityLabel: availabilityLabel[provider.availability] || provider.availability,
      status: provider.status,
      statusReason: provider.statusReason,
      suspendedUntil: provider.suspendedUntil,
      priceLabel: priceLabel[provider.priceRange] || provider.priceRange || "",
      verificationLabel: { UNVERIFIED: "Sin verificar", PHONE: "Teléfono verificado", COMPLETE: "Perfil verificado" }[provider.verificationLevel] || provider.verificationLevel || "Sin verificar",
      profileSignalLabel: provider.trustScore >= 80 ? "Perfil comercial sólido" : "Perfil en construcción",
      description: provider.shortDescription || "",
      image: provider.photos?.[0] || "",
      isOwnProfile: provider.id === ownedProviderId,
    }));
  }, [results, ownedProviderId]);

  useEffect(() => {
    if (selectedId) {
      cardRefs.current[selectedId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedId]);

  const showInList = (id: string) => {
    setSelectedId(id);
    setMobileView("list");
    window.requestAnimationFrame(() => cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  return (
    <div className="search-page">
      <header className="search-toolbar">
        <form onSubmit={event => { event.preventDefault(); setParams(query ? { query } : {}); }}>
          <Search />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="¿Qué proveedor necesitás?" aria-label="Buscar proveedores" />
          <button>Buscar</button>
        </form>
        <div className="mobile-view-switch" aria-label="Vista de resultados">
          <button className={mobileView === "list" ? "active" : ""} onClick={() => setMobileView("list")}><List /> Lista</button>
          <button className={mobileView === "map" ? "active" : ""} onClick={() => setMobileView("map")}><Map /> Mapa</button>
        </div>
      </header>

      <div className="search-layout">
        <aside className="filters">
          <h2><SlidersHorizontal /> Afinar resultados</h2>
          <label>Ciudad
            <select value={city} onChange={event => setCity(event.target.value)}>
              <option value="">Todas</option>
              {CREATIVE_CITIES.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Categoría
            <select value={category} onChange={event => setCategory(event.target.value)}>
              <option value="">Todas</option>
              {CATEGORY_OPTIONS.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Precio
            <select value={price} onChange={event => setPrice(event.target.value)}>
              <option value="">Cualquier rango</option>
              {Object.entries(priceLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Confianza mínima <strong>{trust}</strong>
            <input type="range" min="0" max="90" step="10" value={trust} onChange={event => setTrust(Number(event.target.value))} />
          </label>
          <label className="check">
            <input type="checkbox" checked={false} onChange={() => {}} />
            <CalendarCheck /> Disponible ahora
          </label>
        </aside>

        <main className={`results ${mobileView === "list" ? "mobile-active" : ""}`}>
          <section className="intent-summary">
            <Sparkles />
            <div>
              <strong>Entendimos tu búsqueda</strong>
              <span>Categoría: {intent.category || "abierta"} · Ciudad: {intent.city || "cualquiera"} · Presupuesto: {intent.budget ? priceLabel[intent.budget] : "sin definir"}</span>
            </div>
          </section>

          <div className="results-heading">
            <div>
              <h1>{results.length} proveedores para comparar</h1>
              <p>Ordenados por confianza, cercanía, precio y disponibilidad.</p>
            </div>
          </div>

          {isLoading ? (
            <SkeletonRows count={5} />
          ) : results.length === 0 ? (
            <EmptyState icon={<Search />} title="No encontramos proveedores exactos">
              Probá con otra ciudad, categoría o rango de precio.
            </EmptyState>
          ) : (
            <div className="provider-list">
              {results.map((provider: any) => (
                <article
                  ref={node => { cardRefs.current[provider.id] = node; }}
                  className={`provider-result ${hoveredId === provider.id || selectedId === provider.id ? "map-linked-active" : ""}`}
                  key={provider.id}
                  onMouseEnter={() => setHoveredId(provider.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedId(provider.id)}
                >
                  {provider.photos?.[0] ? (
                    <img src={provider.photos[0]} alt="" />
                  ) : (
                    <div className="provider-result-image-placeholder" aria-hidden="true">
                      <MapPin />
                    </div>
                  )}
                  <div className="provider-body">
                    <div className="provider-title">
                      <div>
                        <span>{provider.category}</span>
                        <h2>{provider.displayName}</h2>
                      </div>
                      <TrustBadge score={provider.trustScore} />
                    </div>
                    <p>{provider.shortDescription}</p>
                    <div className="badges">
                      <span className="badge"><MapPin />{provider.city}</span>
                      {provider.priceRange && <PriceBadge value={provider.priceRange as any} />}
                      <AvailabilityBadge value={provider.availability as any} />
                      <VerificationBadge level={provider.verificationLevel as any} />
                    </div>
                    <div className="recommendation">
                      <Sparkles /> Recomendado porque combina {provider.trustScore >= 80 ? "confianza alta" : "experiencia local"} y {availabilityLabel[provider.availability]?.toLowerCase() || "disponibilidad"}.
                    </div>
                    <div className="card-actions">
                      <Link className="button secondary" to={`/providers/${provider.id}`}>Ver perfil</Link>
                      {provider.status === "SUSPENDED" || provider.status === "BANNED" ? (
                        <span className="button secondary disabled">{provider.status === "BANNED" ? "Proveedor baneado" : "Proveedor suspendido"}</span>
                      ) : provider.id === ownedProviderId ? (
                        <Link className="button primary" to="/me/profile/edit">Editar mi perfil</Link>
                      ) : (
                        <button className="button primary" onClick={() => navigate(`/requests/new?providerId=${provider.id}`)}>Solicitar cotización</button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className={`map-panel ${mobileView === "map" ? "mobile-active" : ""}`} aria-label="Mapa interactivo de proveedores">
          <MvpProviderMap
            providers={mapProviders}
            focusCity={(city || intent.city) || null}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onSelectProvider={setSelectedId}
            onShowInList={showInList}
          />
        </aside>
      </div>
    </div>
  );
}
