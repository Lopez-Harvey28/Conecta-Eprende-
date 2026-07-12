# Admin reviewer, super admin y estados de proveedor

## Decisión técnica

- `User.role` se mantiene para compatibilidad con el login y rutas existentes.
- Los permisos granulares se guardan en `RoleAssignment`, permitiendo que una cuenta tenga roles como `REQUESTER`, `PROVIDER`, `ADMIN_REVIEWER` o `SUPER_ADMIN`.
- Las sanciones del MVP se aplican a nivel de `Provider.status`: los 6 estados están implementados. `DRAFT`, `INACTIVE` y `TEMPORARILY_RESTRICTED` son estados de ciclo de vida con control completo.
- Las acciones sensibles se registran en `ModerationAuditLog`.

## Permisos

- `ADMIN_REVIEWER`: puede listar reportes, revisar evidencia agregada, agregar notas, descartar, escalar, inactivar proveedores.
- `SUPER_ADMIN`: puede hacer lo anterior y además restringir temporalmente, suspender, banear o reactivar perfiles proveedor.
- El frontend muestra acciones según rol, pero la autorización real se valida en backend.

## Status de proveedor

| Status | ¿Público? | ¿Recibe quotes? | Descripción |
|---|---|---|---|
| `DRAFT` | No | No | Perfil en modo borrador. Visible solo para el owner. Debe pasar `/publish`. |
| `ACTIVE` | Sí | Sí | Operando normalmente. |
| `INACTIVE` | No | No | Pausado voluntariamente por el owner. Sin sanción. |
| `TEMPORARILY_RESTRICTED` | Sí | Sí | Restringido temporalmente por contenido/revisión. Banner visible. |
| `SUSPENDED` | Sí (banner) | No | Suspendido por riesgo. Banner rojo. |
| `BANNED` | Sí (banner) | No | Baneado permanentemente. Banner negro. |

El backend rechaza `POST /api/quotes` para `DRAFT`, `INACTIVE`, `SUSPENDED` y `BANNED`.

## Matriz de transiciones de estado

Acciones del owner (vía `/api/providers/:id/publish`):

| Desde | Hacia | Actor | Ruta |
|---|---|---|---|
| DRAFT | ACTIVE | Owner (con readiness) | `POST /publish` |

Acciones de moderación (vía `/api/admin/providers/:id/*`):

| Desde | Hacia | Actor | Ruta |
|---|---|---|---|
| * | ACTIVE | Super admin | `POST /reactivate` |
| * | INACTIVE | Admin reviewer+ | `POST /inactivate` |
| ACTIVE | TEMPORARILY_RESTRICTED | Super admin | `POST /restrict` |
| ACTIVE | SUSPENDED | Super admin | `POST /suspend` |
| ACTIVE | BANNED | Super admin | `POST /ban` |
| INACTIVE | TEMPORARILY_RESTRICTED | Super admin | `POST /restrict` |
| SUSPENDED | ACTIVE | Super admin | `POST /reactivate` |
| SUSPENDED | INACTIVE | Super admin | `POST /inactivate` |
| SUSPENDED | BANNED | Super admin | `POST /ban` |
| TEMPORARILY_RESTRICTED | ACTIVE | Super admin | `POST /reactivate` |
| TEMPORARILY_RESTRICTED | INACTIVE | Super admin | `POST /inactivate` |
| TEMPORARILY_RESTRICTED | SUSPENDED | Super admin | `POST /suspend` |
| TEMPORARILY_RESTRICTED | BANNED | Super admin | `POST /ban` |
| BANNED | *(ninguna)* | — | — |

## Visibilidad por status

| Status | Catalog visible? | Búsqueda visible? | Notas |
|---|---|---|---|
| DRAFT | Solo owner | No | Catalog privado del owner |
| ACTIVE | Sí | Sí | — |
| INACTIVE | Solo owner | No | Catalog privado del owner |
| TEMPORARILY_RESTRICTED | Sí | Sí | Banner de restricción |
| SUSPENDED | Solo owner | No | Catalog privado; banner |
| BANNED | Solo owner | No | Catalog privado; banner |

## Rutas principales

- `GET /api/admin/risk-reports`
- `GET /api/admin/risk-reports/:id`
- `PATCH /api/admin/risk-reports/:id/status`
- `POST /api/admin/risk-reports/:id/escalate`
- `POST /api/admin/providers/:providerId/suspend`
- `POST /api/admin/providers/:providerId/ban`
- `POST /api/admin/providers/:providerId/reactivate`
- `POST /api/admin/providers/:providerId/restrict` — super admin
- `POST /api/admin/providers/:providerId/inactivate` — admin reviewer+
- `POST /api/providers/:id/publish` — owner (DRAFT → ACTIVE)
- `GET /api/admin/audit-log`

## Cuentas seed

Todas usan la contraseña:

```text
Conecta123!
```

| Propósito | Email | Status del provider |
|---|---|---|
| Solicitante normal | `requester@conecta.test` | — |
| Proveedor activo | `textil@conecta.test` | ACTIVE |
| Proveedor suspendido | `cafe@conecta.test` | SUSPENDED |
| Proveedor baneado | `equipos@conecta.test` | BANNED |
| Proveedor borrador | `draft@conecta.test` | DRAFT |
| Proveedor inactivo | `inactive@conecta.test` | INACTIVE |
| Proveedor restringido | `restricted@conecta.test` | TEMPORARILY_RESTRICTED |
| Admin reviewer | `admin@conecta.test` | — |
| Super admin | `superadmin@conecta.test` | — |

## Prueba manual mínima

1. Ejecutar migraciones y seed.
2. Entrar como `requester@conecta.test`.
3. Buscar proveedores y abrir un proveedor activo, confirmar que puede solicitar cotización.
4. Verificar que `draft@conecta.test` NO aparece en búsqueda.
5. Verificar que `inactive@conecta.test` NO aparece en búsqueda.
6. Verificar que `restricted@conecta.test` SÍ aparece con banner "Restringido temporalmente".
7. Abrir `cafe@conecta.test` como provider suspendido, confirmar banner y CTA bloqueado.
8. Abrir proveedor `equipos@conecta.test`, confirmar banner de baneo y CTA bloqueado.
9. Intentar crear una solicitud directa contra un provider suspendido/baneado, confirmar error backend `403`.
10. Entrar como `admin@conecta.test`, abrir `/admin/risk-reports`, inactivar un proveedor.
11. Confirmar que admin reviewer no puede restringir/suspender/banear.
12. Entrar como `superadmin@conecta.test`, abrir `/admin/risk-reports`, restringir temporalmente proveedor activo.
13. Confirmar entrada en auditoría reciente.
14. Hacer login como `draft@conecta.test`, editar perfil, verificar readiness checklist, publicar.

## Limitaciones conocidas

- El MVP implementa sanciones provider-level. Account-level suspension/ban queda diferido para una iteración posterior.
- Los reportes muestran evidencia agregada y sanitizada, no contenido privado de chats.