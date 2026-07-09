# Implementation audit — profile, auth, rating and admin

## Current frontend structure

- React 19 + Vite with React Router routes in `src/App.tsx`.
- Page modules live in `src/pages`; reusable layout/auth/map UI lives in `src/components`.
- Zustand stores are used for domain state (`src/stores/mvp-store.ts`) and ephemeral auth session (`src/stores/auth-store.ts`).
- `useCurrentUser()` is the frontend identity boundary used by protected pages.

## Current backend structure

- Express is mounted from `server.ts`, with Vite middleware in development and static serving in production.
- Current API routes are lightweight in-memory endpoints for providers, quotes and AI helpers. Legacy formalization endpoints/data may exist for compatibility but are not part of the active MVP surface.
- No destructive database migration is applied. Prisma exists in the repo, but this MVP still uses memory/local state for most flows.

## Existing login/auth status

- Real login is not implemented yet.
- `/api/auth/session` is the integration boundary for a future cookie/session middleware.
- The frontend can bootstrap a default admin session for development unless `VITE_BOOTSTRAP_ADMIN=false`.
- Session data is intentionally not serialized with marketplace/domain data.

## Existing database/domain entities

- Domain store already contains accounts, requester/client profiles, provider profiles, offers/catalog, quote requests, reviews and reports.
- Provider ownership is modeled with `ProviderProfile.ownerUserId`.
- Admin is a role on the user session/role assignments, not a public profile.

## Missing or partial entities

- Production database persistence and migrations.
- Real login endpoints and secure cookie middleware.
- Full backend authorization for every route.
- Durable audit log storage.
- Production risk-report generation pipeline.

## Safe implementation plan

1. Keep one account/session model and separate requester/provider contexts.
2. Align role names to the serializable contract: `REQUESTER`, `PROVIDER`, `ADMIN_REVIEWER`, `SUPER_ADMIN`.
3. Add pure backend-ready rating, review and risk functions without coupling them to storage.
4. Add API adapter modules so components do not need to call `fetch` directly in future slices.
5. Add documentation and tests around serialization, rating and permission boundaries.
6. Defer schema migrations until real backend persistence is selected.
