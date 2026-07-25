# Admin Permission Test Runbook

Smoke tests de permisos para ADMIN_REVIEWER y SUPER_ADMIN contra los endpoints HTTP reales del backend Express.

## Requisitos

1. **PostgreSQL corriendo** — verificar `DATABASE_URL` en `.env`
2. **Seed ejecutado** — crea las cuentas admin necesarias:
   ```bash
   npm run db:seed
   # Credenciales:
   #   admin@conecta.test     / Conecta123!  (ADMIN_REVIEWER)
   #   superadmin@conecta.test / Conecta123! (SUPER_ADMIN)
   #   textil@conecta.test    / Conecta123!  (PROVIDER, dueño de seed_provider_textil)
   ```
3. **Server Express corriendo** en otra terminal:
   ```bash
   npm run dev
   ```

## Ejecutar tests

```bash
# Con npm script (recomendado)
npm run test:admin-permissions

# O directamente con tsx
npx tsx scripts/test_admin_permissions.ts

# Para usar otra URL del server:
API_URL=http://localhost:3001 npx tsx scripts/test_admin_permissions.ts
```

## Salida esperada

```
-> Setup: login + test provider + test reports

-> Running tests:

V ADMIN_REVIEWER list risk-reports -> 200
V ADMIN_REVIEWER get report detail -> 200
...
V Audit log entry for PROVIDER_SUSPENDED
V Audit log entry for REPORT_ESCALATED

ADMIN_PERMISSION_TESTS_OK (21 passed, 0 skipped, 0 failed)
```

Si algún test falla, el output muestra cual falló con el mensaje de error del servidor.

## Matriz de tests

| Test | Método | Path | Rol | Status |
|------|--------|------|-----|--------|
| ADMIN_REVIEWER list risk-reports -> 200 | GET | /api/admin/risk-reports | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER get report detail -> 200 | GET | /api/admin/risk-reports/:id | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER dismiss report -> 200 | PATCH | /api/admin/risk-reports/:id/status | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER escalate report -> 200 | POST | /api/admin/risk-reports/:id/escalate | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER cannot set ACTION_TAKEN -> 403 | PATCH | /api/admin/risk-reports/:id/status | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER can inactivate provider -> 200 | POST | /api/admin/providers/:id/inactivate | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER cannot suspend -> 403 | POST | /api/admin/providers/:id/suspend | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER cannot ban -> 403 | POST | /api/admin/providers/:id/ban | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER cannot reactivate -> 403 | POST | /api/admin/providers/:id/reactivate | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER cannot restrict -> 403 | POST | /api/admin/providers/:id/restrict | ADMIN_REVIEWER | ✅ |
| ADMIN_REVIEWER cannot access audit-log -> 403 | GET | /api/admin/audit-log | ADMIN_REVIEWER | ✅ |
| PROVIDER cannot list risk-reports -> 403 | GET | /api/admin/risk-reports | PROVIDER | ✅ |
| SUPER_ADMIN restrict with suspendedUntil -> 200 | POST | /api/admin/providers/:id/restrict | SUPER_ADMIN | ✅ |
| SUPER_ADMIN suspend with reason -> 200 | POST | /api/admin/providers/:id/suspend | SUPER_ADMIN | ✅ |
| SUPER_ADMIN reactivate -> 200 | POST | /api/admin/providers/:id/reactivate | SUPER_ADMIN | ✅ |
| SUPER_ADMIN ban with reason -> 200 | POST | /api/admin/providers/:id/ban | SUPER_ADMIN | ✅ |
| SUPER_ADMIN can set ACTION_TAKEN -> 200 | PATCH | /api/admin/risk-reports/:id/status | SUPER_ADMIN | ✅ |
| SUPER_ADMIN suspend without reason -> 400 | POST | /api/admin/providers/:id/suspend | SUPER_ADMIN | ✅ (Zod) |
| POST suspend without auth -> 401 | POST | /api/admin/providers/:id/suspend | none | ✅ (auth) |
| Audit log entry for PROVIDER_SUSPENDED | GET | /api/admin/audit-log | SUPER_ADMIN | ✅ |
| Audit log entry for REPORT_ESCALATED | GET | /api/admin/audit-log | SUPER_ADMIN | ✅ |

## Notas sobre idempotencia

- El script crea un provider temporal con slug `test-admin-perm-*` al inicio y lo elimina al final via `prisma.provider.deleteMany`.
- El script crea **5 RiskReport temporales** en estado `OPEN` asociados al provider de prueba, para que los tests de reports (dismiss/escalate/ACTION_TAKEN/audit) sean deterministas e independientes del seed. Estos reports se eliminan explícitamente en cleanup antes del provider (con fallback al cascade de Prisma).
- Los tests que mutan estado del provider (suspend/reactivate/restrict/ban) sobre el provider temporal hacen cleanup al final de cada test (reactivate post-ban, reactivate post-restrict, etc.) para mantener el estado determinista entre corridas.
- La suite es **totalmente idempotente**: se puede ejecutar múltiples veces sin re-seedear, ya que crea y limpia sus propios fixtures.

## Agregar nuevos tests

```typescript
// En runAll(), agregar antes del bloque "Execute":
test("DESCRIPCION -> EXPECTED_STATUS", async () => {
  const r = await apiRequest("METHOD", "/api/path", cookie, { body });
  assert.equal(r.status, EXPECTED_CODE);
});
```

## Integración CI

El test requiere:
- PostgreSQL corriendo (`DATABASE_URL`)
- Seed aplicado (necesario para las cuentas admin y provider de login: `admin@`, `superadmin@`, `textil@`)
- Server Express escuchando (`npm run dev`)

No es standalone. Para CI, sequence típico:
```bash
npm run db:seed
npm run dev &
sleep 5
npm run test:admin-permissions
kill %1
```

La suite crea y limpia sus propios fixtures (provider temporal + 5 RiskReport), por lo que no contamina el estado del seed entre corridas.