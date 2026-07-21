# Manual profile test checklist

## Enable locally

Set the flag before running the dev server:

```bash
VITE_ENABLE_DEMO_PROFILE_SWITCHER=true
```

The switcher is a temporary development tool. It does not represent real authentication, does not grant real backend permissions, and must be disabled before production. Backend authorization remains required.

## Checklist — provider lifecycle

### Solicitar cotización
- [ ] Requester puede buscar proveedores activos y enviar cotización.
- [ ] Requester recibe error 403 al intentar cotizar contra provider suspendido o baneado.

### DRAFT → ACTIVE (publish flow)
- [ ] Login como `draft@conecta.test` (provider DRAFT).
- [ ] El perfil muestra banner "Borrador" con checklist de requisitos.
- [ ] El botón "Publicar perfil" está deshabilitado si tagline < 10 chars o description < 40 chars o sin ítems en catálogo.
- [ ] Completar perfil (tagline ≥ 10, description ≥ 40, al menos 1 ítem de catálogo).
- [ ] El botón "Publicar perfil" se habilita.
- [ ] Hacer clic en "Publicar perfil" — el provider aparece en búsqueda de requester.

### INACTIVE
- [ ] Login como `inactive@conecta.test`.
- [ ] El perfil muestra banner "Inactivo".
- [ ] El catálogo NO es visible para requesters (solo owner).
- [ ] No aparece en búsquedas.

### TEMPORARILY_RESTRICTED
- [ ] Login como `restricted@conecta.test`.
- [ ] El perfil muestra banner "Restringido temporalmente" con reason y fecha.
- [ ] El proveedor SÍ aparece en búsquedas (visible pero con banner).
- [ ] Los ítems de catálogo son visibles para requesters.
- [ ] El CTA de cotización está habilitado (puede recibir quotes).

### SUSPENDED / BANNED
- [ ] Login como `cafe@conecta.test` (SUSPENDED).
- [ ] Banner rojo de suspensión con reason y fecha.
- [ ] CTA de cotización bloqueado.
- [ ] Login como `equipos@conecta.test` (BANNED).
- [ ] Banner negro de baneo con reason.
- [ ] CTA de cotización bloqueado.
- [ ] Neither aparece en búsquedas.

### Super admin — acciones de moderación
- [ ] Login como `superadmin@conecta.test`.
- [ ] Ir a `/admin/risk-reports`.
- [ ] Seleccionar un proveedor ACTIVE y aplicar "Restringir temporalmente" — confirmar que cambia a TEMPORARILY_RESTRICTED.
- [ ] Aplicar "Inactivar" — confirmar que cambia a INACTIVE.
- [ ] Reactivar un proveedor SUSPENDED — confirmar que vuelve a ACTIVE.
- [ ] Confirmar que cada acción genera entrada en auditoría.

### Admin reviewer — permisos limitados
- [ ] Login como `admin@conecta.test`.
- [ ] Puede ver `/admin/risk-reports`.
- [ ] Puede inactivar proveedor (disponible en UI).
- [ ] NO ve opciones de restringir/suspender/banear (solo super admin).
- [ ] Intentar llamar directamente al endpoint de restringir — esperar 403.

## Checklist existente

- [ ] Switch to Requester only.
- [ ] Requester cannot access provider dashboard as an existing provider.
- [ ] Requester can search providers.
- [ ] Requester can create/send request.
- [ ] Requester sees create provider profile CTA.
- [ ] Switch to Provider draft.
- [ ] Provider draft can edit profile.
- [ ] Provider draft does not appear as active provider unless previewing.
- [ ] Switch to Active provider.
- [ ] Active provider can view provider dashboard.
- [ ] Active provider can view received requests.
- [ ] Active provider can send request to another provider.
- [ ] Provider rating is shown but not editable from frontend.
- [ ] Switch to Suspended provider.
- [ ] Suspended provider shows restricted state.
- [ ] Switch to Admin reviewer.
- [ ] Admin reviewer can view risk reports.
- [ ] Admin reviewer cannot assign admin roles.
- [ ] Switch to Super admin.
- [ ] Super admin can access admin area.
- [ ] Super admin cannot be created from public UI.
- [ ] Disable `VITE_ENABLE_DEMO_PROFILE_SWITCHER`.
- [ ] Demo switcher disappears.