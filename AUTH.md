# Conecta Emprende AI — Autenticación

Sistema de autenticación con JWT + HTTP-only cookies + Refresh Tokens rotativos.

## Stack Tecnológico

- **Contraseñas:** bcrypt (12 rondas)
- **Tokens:** JWT (jsonwebtoken)
- **Refresh tokens:** Almacenados en PostgreSQL
- **Almacenamiento:** HTTP-only cookies (no localStorage)
- **OAuth:** Google OAuth 2.0

## Modelo de Datos

### User

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | cuid | ID único |
| email | String @unique | Correo electrónico |
| name | String? | Nombre |
| image | String? | URL de avatar |
| role | Role enum | USER / PROVIDER / ADMIN |
| password | String? | Hash bcrypt (null para OAuth) |
| emailVerified | DateTime? | Fecha de verificación de email |
| createdAt | DateTime | Fecha de registro |

### RefreshToken

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | cuid | ID único |
| token | String @unique | Token de actualización |
| userId | String | Relación a User |
| expiresAt | DateTime | Expiración (7 días) |

### Account

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | cuid | ID único |
| userId | String | Relación a User |
| provider | String | "google" / "credentials" |
| providerAccountId | String | ID en el provider OAuth |
| access_token | String? | Token de acceso OAuth |
| refresh_token | String? | Token de actualización OAuth |
| expires_at | Int? | Expiración del token OAuth |

## API Endpoints

### Registro

```
POST /api/auth/register
Content-Type: application/json

{
  "name": "María García",
  "email": "maria@email.com",
  "password": "SecurePass123"
}

Respuesta (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "maria@email.com",
      "name": "María García",
      "role": "USER"
    }
  }
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "maria@email.com",
  "password": "SecurePass123"
}

Respuesta (200):
- Sets HTTP-only cookies: access_token (15min), refresh_token (7d)
- Returns user object
```

### Logout

```
POST /api/auth/logout

Respuesta (200):
- Clears HTTP-only cookies
- Deletes refresh token from database
```

### Renovar Token

```
POST /api/auth/refresh

- Reads refresh_token from HTTP-only cookie
- Validates against database
- Rotates: deletes old refresh token, creates new
- Returns new access_token cookie

Respuesta (200):
{
  "success": true,
  "message": "Tokens renovados"
}
```

### Usuario Actual

```
GET /api/auth/me

- Requires access_token cookie
- Returns user with providers list

Respuesta (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "maria@email.com",
      "name": "María García",
      "role": "USER",
      "providers": [...]
    }
  }
}
```

### OAuth Google

```
GET /api/auth/google
→ Redirects to Google Consent Screen

GET /api/auth/google/callback?code=xxx
→ Creates/updates User + Account
→ Sets auth cookies
→ Redirects to /
```

## Flujo de Tokens

```
Access Token (JWT):
- Duración: 15min (dev) / 1h (prod)
- Contiene: userId, email, role
- Almacenamiento: HTTP-only cookie
- Verificación: middleware `authenticate`

Refresh Token (opaco):
- Duración: 7 días
- Almacenamiento: PostgreSQL (RefreshToken table)
- Rotación: cada uso genera uno nuevo (invalidates old)
- Verificación: se valida contra DB y expiration
```

## Middleware de Autenticación

```typescript
// server.ts - authenticate middleware
const authenticate = async (req, res, next) => {
  const accessToken = req.cookies?.access_token;
  if (!accessToken) {
    return res.status(401).json({ success: false, error: "No autenticado" });
  }
  const payload = verifyAccessToken(accessToken);
  if (!payload) {
    return res.status(401).json({ success: false, error: "Sesión expirada" });
  }
  (req as any).user = payload;
  next();
};
```

## Variables de Entorno

```env
# JWT
JWT_SECRET="..."           # min 32 chars
JWT_REFRESH_SECRET="..."   # min 32 chars
ACCESS_TOKEN_EXPIRY="15m"  # dev: 15m, prod: 1h
REFRESH_TOKEN_EXPIRY="7d"

# OAuth Google
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Seguridad Implementada

1. **Contraseñas:** bcrypt 12 rondas (industry standard)
2. **Tokens:** firmados con secrets distintos (no compartir secrets)
3. **HTTP-only cookies:** no JavaScript access (XSS protection)
4. **SameSite:** strict (prod), lax (dev) - CSRF protection
5. **Refresh token rotation:** cada uso invalida el anterior
6. **OAuth:** PKCE-ready, consent screen, offline access

## Rutas Protegidas

| Ruta | Rol Requerido |
|------|--------------|
| /me/* | USER, PROVIDER, ADMIN |
| /admin/* | ADMIN |
| /settings/security | USER, PROVIDER, ADMIN |

## Dependencias Instaladas

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cookie-parser": "^1.4.6"
}
```

## Próximos Pasos (Iteraciones Futuras)

- [ ] Email verification (EmailVerificationToken model existe)
- [ ] Password reset flow (PasswordResetToken model existe)
- [ ] 2FA/TOTP
- [ ] Rate limiting en /auth/login
- [ ] Revocar todos los refresh tokens de un usuario
- [ ] Sesiones activas (lista de dispositivos)