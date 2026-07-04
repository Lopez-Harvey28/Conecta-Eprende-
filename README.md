# Conecta Emprende AI

MVP para conectar personas emprendedoras, MIPYMES y proveedores de Nicaragua mediante búsqueda en lenguaje natural, señales de confianza y solicitudes de cotización verificables.

## Ejecutar

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Verificación

```bash
npm run lint
npm run build
```

## Flujo de demostración

1. Buscar `Necesito empaques ecológicos en León que sean baratos`.
2. Abrir un perfil y revisar verificación, confianza, medallas y formalización.
3. Crear una solicitud de cotización.
4. Responder y confirmar el trabajo desde ambas partes.
5. Publicar una reseña desbloqueada por la finalización bilateral.
6. Editar el perfil público desde Mi perfil.
7. Enviar un reporte y revisarlo desde Administración.

Los datos de dominio persisten en `localStorage`; la sesión nunca se incluye en esa serialización. Mientras se conecta el login real, la aplicación inicia con la cuenta administradora que también posee `provider-1`.

Para desactivar ese bootstrap al conectar autenticación:

```bash
VITE_BOOTSTRAP_ADMIN=false
```

El middleware de login debe validar la cookie HTTP-only, colocar el `AuthSessionDTO` en `res.locals.authSession` y exponerlo mediante `GET /api/auth/session`.
