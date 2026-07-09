# Admin reviewer, super admin y estados de proveedor

## Decisión técnica

- `User.role` se mantiene para compatibilidad con el login y rutas existentes.
- Los permisos granulares se guardan en `RoleAssignment`, permitiendo que una cuenta tenga roles como `REQUESTER`, `PROVIDER`, `ADMIN_REVIEWER` o `SUPER_ADMIN`.
- Las sanciones del MVP se aplican a nivel de `Provider.status`: `ACTIVE`, `SUSPENDED` o `BANNED`.
- Las acciones sensibles se registran en `ModerationAuditLog`.

## Permisos

- `ADMIN_REVIEWER`: puede listar reportes, revisar evidencia agregada, agregar notas, descartar y escalar.
- `SUPER_ADMIN`: puede hacer lo anterior y además suspender, banear o reactivar perfiles proveedor.
- El frontend muestra acciones según rol, pero la autorización real se valida en backend.

## Status de proveedor

- `ACTIVE`: recibe solicitudes normalmente.
- `SUSPENDED`: aparece con banner y no puede recibir nuevas solicitudes.
- `BANNED`: aparece con banner fuerte y no puede recibir nuevas solicitudes.

El backend rechaza `POST /api/quotes` cuando el proveedor está `SUSPENDED` o `BANNED`.

## Rutas principales

- `GET /api/admin/risk-reports`
- `GET /api/admin/risk-reports/:id`
- `PATCH /api/admin/risk-reports/:id/status`
- `POST /api/admin/risk-reports/:id/escalate`
- `POST /api/admin/providers/:providerId/suspend`
- `POST /api/admin/providers/:providerId/ban`
- `POST /api/admin/providers/:providerId/reactivate`
- `GET /api/admin/audit-log`

## Cuentas seed

Todas usan la contraseña:

```text
Conecta123!
```

| Propósito | Email |
|---|---|
| Solicitante normal | `requester@conecta.test` |
| Proveedor activo | `textil@conecta.test` |
| Proveedor suspendido | `cafe@conecta.test` |
| Proveedor baneado | `equipos@conecta.test` |
| Admin reviewer | `admin@conecta.test` |
| Super admin | `superadmin@conecta.test` |

## Prueba manual mínima

1. Ejecutar migraciones y seed.
2. Entrar como `requester@conecta.test`.
3. Buscar proveedores y abrir un proveedor activo, confirmar que puede solicitar cotización.
4. Abrir `cafe@conecta.test` como provider suspendido o buscar su perfil, confirmar banner y CTA bloqueado.
5. Abrir proveedor `equipos@conecta.test`, confirmar banner de baneo y CTA bloqueado.
6. Intentar crear una solicitud directa contra un provider suspendido/baneado, confirmar error backend `403`.
7. Entrar como `admin@conecta.test`, abrir `/admin/risk-reports`, marcar reporte en revisión, descartar o escalar.
8. Confirmar que admin reviewer no puede suspender/banear.
9. Entrar como `superadmin@conecta.test`, abrir `/admin/risk-reports`, suspender o reactivar proveedor con razón.
10. Confirmar entrada en auditoría reciente.

## Limitaciones conocidas

- El MVP implementa sanciones provider-level. Account-level suspension/ban queda diferido para una iteración posterior.
- Los reportes muestran evidencia agregada y sanitizada, no contenido privado de chats.
