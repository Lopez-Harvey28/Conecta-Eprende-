import { User, Store, MapPin, Building, Activity, Save, Sparkles, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const providerId = "1";
  const queryClient = useQueryClient();
  
  const { data: provider, isLoading: isProviderLoading } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      const res = await fetch(`/api/providers/${providerId}`);
      const json = await res.json();
      return json.data;
    }
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const res = await fetch(`/api/quotes`);
      const json = await res.json();
      return json.data;
    }
  });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhanceSuccess, setShowEnhanceSuccess] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    category: "",
    city: "",
    bio: "",
    phone: "+505 8000 0000"
  });

  // Sync when data loads
  useEffect(() => {
    if (provider) {
       setFormData({
         displayName: provider.displayName || "",
         category: provider.category || "",
         city: provider.city || "",
         bio: provider.bio || "",
         phone: provider.phone || "+505 8000 0000"
       });
    }
  }, [provider]);

  const saveMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await fetch(`/api/providers/${providerId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(updatedData)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleEnhanceBio = async () => {
    if (!formData.bio.trim() || formData.bio.length < 10) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/providers/enhance-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: formData.bio, category: formData.category })
      });
      const data = await res.json();
      if (data.success && data.bio) {
        setFormData({ ...formData, bio: data.bio });
        setShowEnhanceSuccess(true);
        setTimeout(() => setShowEnhanceSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 h-full overflow-y-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu información pública, servicios y ubicación de tu negocio.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-12 sm:relative sm:-top-16">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center border-4 border-white shadow-md text-3xl font-extrabold text-slate-800">
                {formData.displayName.charAt(0)}
              </div>
            </div>
            
            <div className="sm:-mt-4">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Información General</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Negocio</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.displayName}
                      onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoría Principal</label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900 appearance-none"
                    >
                      <option value="Diseño Gráfico">Diseño Gráfico</option>
                      <option value="Desarrollo Web">Desarrollo Web</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Electricidad">Electricidad</option>
                      <option value="Limpieza">Limpieza</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ciudad / Departamento</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900 appearance-none"
                    >
                      <option value="Managua">Managua</option>
                      <option value="León">León</option>
                      <option value="Granada">Granada</option>
                      <option value="Estelí">Estelí</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono (WhatsApp)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-slate-700">Biografía / Acerca de</label>
                    <button 
                      onClick={handleEnhanceBio}
                      disabled={isEnhancing || formData.bio.length < 10}
                      className="text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {showEnhanceSuccess ? (
                         <><Check className="w-3.5 h-3.5" /> ¡Mejorado!</>
                      ) : (
                         <><Sparkles className="w-3.5 h-3.5" /> {isEnhancing ? "Mejorando..." : "Mejorar con IA"}</>
                      )}
                    </button>
                  </div>
                  <textarea 
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all text-[15px] leading-relaxed font-medium text-slate-900 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="px-6 py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
             <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Cotizaciones</div>
             <div className="text-3xl font-extrabold">{quotes.length}</div>
          </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Trust Score</div>
             <div className="text-3xl font-extrabold text-[var(--brand)]">{provider?.score || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Perfil comercial</div>
             <div className="text-sm font-extrabold text-slate-900 mt-2 flex items-center gap-2">
               <Building className="w-5 h-5 text-green-500" /> Información pública activa
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
