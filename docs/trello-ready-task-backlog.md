# Trello-Ready Task Backlog

Copy each card into Trello under the matching workstream.

## 1. Database and Seed Data

### Card: Backfill normalized location/category relations for existing non-seed data

- Goal: Ensure all existing providers and catalog items have `cityId` and category joins.
- Description: Write a safe non-destructive backfill script for providers/items created before normalization.
- Assigned area: Database
- Priority: P1
- Difficulty: Medium
- Dependencies: Normalized schema migration applied.
- Acceptance criteria:
  - Script fills `Provider.cityId`, `CatalogItem.cityId`.
  - Script creates `ProviderCategory` and `CatalogItemCategory` links.
  - Script is idempotent.
  - No legacy fields are deleted.
- Suggested files: `prisma/schema.prisma`, `prisma/seed.ts`, new `scripts/backfill_normalized_relations.ts`.
- Notes: Do not run destructive reset.

### Card: Decide and implement persistent role assignment model

- Goal: Represent `REQUESTER`, `PROVIDER`, `ADMIN_REVIEWER`, and `SUPER_ADMIN` consistently.
- Description: Current DB enum only has `USER`, `PROVIDER`, `ADMIN` while frontend contract has granular roles.
- Assigned area: Database / Backend
- Priority: P0
- Difficulty: Hard
- Dependencies: Product decision on role model.
- Acceptance criteria:
  - DB can distinguish admin reviewer and super admin.
  - `/api/auth/me` returns consistent role labels.
  - Backend route guards use persisted permissions.
  - Demo roles cannot grant real permissions.
- Suggested files: `prisma/schema.prisma`, `server.ts`, `src/lib/identity.ts`, `src/hooks/use-current-user.ts`.
- Notes: Prefer additive `RoleAssignment` table over expanding one enum if multi-role users are required.

### Card: Define single trust score read model

- Goal: Avoid divergence between `TrustScore`, `ProviderMetrics`, and frontend seed scores.
- Description: Pick one source for current display score and one history/audit table.
- Assigned area: Database / Backend
- Priority: P1
- Difficulty: Medium
- Dependencies: Review/completion events.
- Acceptance criteria:
  - Provider API returns one current trust score field.
  - Snapshot history remains append-only.
  - Legacy `TrustScore` usage is documented or removed later.
- Suggested files: `prisma/schema.prisma`, `src/lib/providers-service.ts`, `src/domain/rating/calculateTrustScore.ts`.
- Notes: Keep compatibility until UI is migrated.

## 2. Auth and Role/Profile Contexts

### Card: Protect all request/chat backend routes

- Goal: Make request-linked chat safe and production-credible.
- Description: Add `authenticate` to quote/request routes and verify participant access.
- Assigned area: Backend
- Priority: P0
- Difficulty: Hard
- Dependencies: Auth tokens working.
- Acceptance criteria:
  - Unauthenticated users cannot create/read/update requests.
  - Requester can read own sent requests.
  - Provider can read requests to their provider profile.
  - Non-participants receive 403.
  - No route accepts `senderId` or `authorId` from request body.
- Suggested files: `server.ts`, `src/lib/quotes-service.ts`, `src/stores/quotes-store.ts`.
- Notes: This blocks reliable reviews and trust score.

### Card: Remove anonymous sender fallback from request creation

- Goal: Prevent invalid request records.
- Description: `POST /api/quotes` currently falls back to `"anonymous"`.
- Assigned area: Backend
- Priority: P0
- Difficulty: Medium
- Dependencies: Protect request routes.
- Acceptance criteria:
  - Request creation uses authenticated `userId` only.
  - Missing auth returns 401.
  - Provider existence is checked before create.
  - Friendly error is returned for invalid provider.
- Suggested files: `server.ts`, `src/lib/quotes-service.ts`.
- Notes: Also prevents FK failures.

### Card: Make demo profile switcher impossible in production builds

- Goal: Avoid accidental frontend role spoofing in production.
- Description: Add visible environment gate and production guard for `VITE_ENABLE_DEMO_PROFILE_SWITCHER`.
- Assigned area: Frontend / QA
- Priority: P1
- Difficulty: Easy
- Dependencies: None.
- Acceptance criteria:
  - Switcher never renders when `NODE_ENV=production`.
  - README clearly says it is dev-only.
  - QA checklist includes disabling it.
- Suggested files: `src/components/dev/DemoProfileSwitcher.tsx`, `.env.example`, `README.md`.
- Notes: Current `.env.example` default is false.

## 3. Requester Profile

### Card: Build requester account dashboard section

- Goal: Give requester-only users a useful `/me` page.
- Description: Show requester identity, active requests, completed requests, reviews written, saved providers, and CTA to create provider profile.
- Assigned area: Frontend
- Priority: P1
- Difficulty: Medium
- Dependencies: Request APIs protected.
- Acceptance criteria:
  - Requester without provider does not see only a business creation empty state.
  - Provider profile CTA remains visible but secondary.
  - Uses real API data when available.
- Suggested files: `src/pages/MyProfileDashboardPage.tsx`, `src/hooks/use-current-user.ts`.
- Notes: Keep account identity separate from provider profile.

### Card: Add requester profile backend/read model if needed

- Goal: Decide whether requester profile is explicit DB table or derived from `User`.
- Description: Current DB has `User`; frontend contract has `ClientProfile`.
- Assigned area: Backend / Database
- Priority: P2
- Difficulty: Medium
- Dependencies: Role/profile context decision.
- Acceptance criteria:
  - Product decision documented.
  - API supports requester page data.
  - No provider metrics stored on requester identity.
- Suggested files: `prisma/schema.prisma`, `src/lib/identity.ts`, docs.
- Notes: Can be deferred if requester profile remains account-derived for MVP.

## 4. Provider Profile and Catalog

### Card: Add DB-backed provider lifecycle status

- Goal: Support draft/active/suspended/banned states consistently.
- Description: Demo profiles include statuses but DB provider does not enforce them.
- Assigned area: Database / Backend / Frontend
- Priority: P1
- Difficulty: Medium
- Dependencies: Admin role model.
- Acceptance criteria:
  - Provider status field exists.
  - Search excludes draft/suspended/banned by default.
  - Public page shows correct unavailable/suspended state.
  - Admin can later change status.
- Suggested files: `prisma/schema.prisma`, `src/lib/providers-service.ts`, `ProviderPage.tsx`, `SearchPage.tsx`.
- Notes: Do not hide data destructively.

### Card: Prevent own-provider request CTA

- Goal: Stop self-request and self-review loopholes.
- Description: Disable or replace request CTA when user owns provider profile.
- Assigned area: Frontend / Backend
- Priority: P0
- Difficulty: Easy
- Dependencies: Auth user loaded.
- Acceptance criteria:
  - Own public profile shows “Editar perfil” instead of “Solicitar cotización”.
  - Backend rejects self-request.
  - Search cards also guard own provider CTA.
- Suggested files: `ProviderPage.tsx`, `SearchPage.tsx`, `server.ts`.
- Notes: Backend check is required even if frontend hides button.

### Card: Align catalog item types between UI and backend

- Goal: Make catalog filters and types consistent.
- Description: Public provider tabs include `PRODUCT`, `SERVICE`, etc., while backend item types are Spanish enum-like strings.
- Assigned area: Frontend / Backend
- Priority: P2
- Difficulty: Easy
- Dependencies: None.
- Acceptance criteria:
  - Tabs count/filter actual backend item types.
  - Editor options match display filters.
  - No empty tabs caused by type mismatch.
- Suggested files: `src/pages/ProviderPage.tsx`, `src/pages/OfferPages.tsx`.
- Notes: Good starter task.

## 5. Request and Chat Flow

### Card: Replace `useState` side effects with `useEffect` in request pages

- Goal: Stabilize request/chat data loading.
- Description: `RequestPages.tsx` uses `useState(() => { ... })` for fetch side effects.
- Assigned area: Frontend
- Priority: P1
- Difficulty: Easy
- Dependencies: None.
- Acceptance criteria:
  - Fetches use `useEffect`.
  - Dependency arrays are correct.
  - No duplicate fetch loops.
  - Manual navigation between request pages refreshes data correctly.
- Suggested files: `src/pages/RequestPages.tsx`.
- Notes: Small but important.

### Card: Fix bilateral completion UI roles

- Goal: Allow correct participant to confirm completion.
- Description: Request detail currently disables requester confirmation unless user role is provider.
- Assigned area: Frontend / Backend
- Priority: P0
- Difficulty: Medium
- Dependencies: Participant role derivation.
- Acceptance criteria:
  - Requester can confirm requester side.
  - Provider can confirm provider side.
  - Each side cannot confirm twice.
  - Backend validates participant role.
- Suggested files: `src/pages/RequestPages.tsx`, `src/pages/ChatPage.tsx`, `server.ts`.
- Notes: Blocks verified review UX.

### Card: Rename API/domain concepts from quotes to requests safely

- Goal: Reduce naming confusion.
- Description: Routes/stores still use quote naming while product says Request/RequestMessage.
- Assigned area: Backend / Frontend
- Priority: P2
- Difficulty: Hard
- Dependencies: Request flow stabilization.
- Acceptance criteria:
  - Public API exposes request naming or clear adapters.
  - Old paths remain redirected/compatible if needed.
  - Docs explain migration.
- Suggested files: `src/lib/quotes-service.ts`, `src/stores/quotes-store.ts`, `server.ts`, `prisma/schema.prisma`.
- Notes: Do after behavior is secure.

## 6. Reviews, Rating, and Trust Score

### Card: Return friendly duplicate-review errors

- Goal: Improve review UX and avoid generic 500s.
- Description: Unique DB constraint prevents duplicates but route does not catch it nicely.
- Assigned area: Backend / Frontend
- Priority: P1
- Difficulty: Easy
- Dependencies: Review route exists.
- Acceptance criteria:
  - Duplicate review returns 409 with clear message.
  - UI shows message.
  - No duplicate DB row is created.
- Suggested files: `server.ts`, `src/pages/RequestPages.tsx`.
- Notes: Good small backend task.

### Card: Recalculate trust score after completed request/review events

- Goal: Make trust score reflect real behavior.
- Description: Review route updates average only; final trust score is not recalculated.
- Assigned area: Backend
- Priority: P1
- Difficulty: Medium
- Dependencies: Secure request/review events.
- Acceptance criteria:
  - On review create, provider metrics and trust score update.
  - TrustScoreSnapshot is appended.
  - Risk penalty is included if available.
  - Tests cover calculation.
- Suggested files: `src/domain/rating/calculateTrustScore.ts`, `server.ts`, `prisma/schema.prisma`.
- Notes: Keep deterministic algorithm version.

### Card: Add backend tests for verified review rules

- Goal: Protect anti-inflation rules.
- Description: Current TS domain tests exist, but route-level cases are missing.
- Assigned area: QA / Backend
- Priority: P1
- Difficulty: Medium
- Dependencies: Auth-protected request routes.
- Acceptance criteria:
  - Cannot review incomplete request.
  - Cannot self-review.
  - Cannot review as non-participant.
  - Cannot duplicate review.
- Suggested files: `scripts/*`, possible new API test script.
- Notes: Use disposable seeded DB only.

## 7. Risk Reports and Admin Review

### Card: Implement DB-backed admin risk-report API

- Goal: Make admin report review real.
- Description: `adminApi` points to routes that do not exist.
- Assigned area: Backend
- Priority: P1
- Difficulty: Medium
- Dependencies: Role model and admin guard.
- Acceptance criteria:
  - `GET /api/admin/risk-reports` returns sanitized reports.
  - `PATCH /api/admin/risk-reports/:id` updates status/reviewer/time.
  - Non-admin gets 403.
  - No private chat content is exposed.
- Suggested files: `server.ts`, `src/api/adminApi.ts`, `prisma/schema.prisma`.
- Notes: Can use seeded `RiskReport` first.

### Card: Connect AdminReportsPage to backend API

- Goal: Stop using localStorage reports for admin workflow.
- Description: Page currently reads `useMvpStore`.
- Assigned area: Frontend
- Priority: P1
- Difficulty: Medium
- Dependencies: Admin risk-report API.
- Acceptance criteria:
  - Page loads DB reports.
  - Status update persists.
  - Loading/error/empty states exist.
  - Admin reviewer vs super admin permissions are respected.
- Suggested files: `src/pages/AdminReportsPage.tsx`, `src/api/adminApi.ts`.
- Notes: Keep current visual layout if useful.

### Card: Add audit log for admin actions

- Goal: Track moderation decisions.
- Description: No audit logs exist for report review, suspension, role assignment.
- Assigned area: Database / Backend
- Priority: P2
- Difficulty: Medium
- Dependencies: Admin APIs.
- Acceptance criteria:
  - Admin action creates audit log row.
  - Includes actor, action, target, timestamp, metadata.
  - Does not store private chat content.
- Suggested files: `prisma/schema.prisma`, `server.ts`.
- Notes: Important before real moderation.

## 8. Search and Nicaragua Map

### Card: Make availability filter functional

- Goal: Remove dead control from search.
- Description: “Disponible ahora” checkbox is hardcoded.
- Assigned area: Frontend / Backend
- Priority: P2
- Difficulty: Easy
- Dependencies: None.
- Acceptance criteria:
  - Checkbox state is controlled.
  - Results filter by `DISPONIBLE`.
  - URL params preserve filter.
- Suggested files: `src/pages/SearchPage.tsx`.
- Notes: Small UX win.

### Card: Decide and enforce Nicaragua map bounds

- Goal: Clarify whether users can pan globally.
- Description: Map is Nicaragua-focused but global tile exploration may be possible.
- Assigned area: Product / Frontend
- Priority: P3
- Difficulty: Easy
- Dependencies: Product decision.
- Acceptance criteria:
  - Decision documented.
  - If limited, Leaflet max bounds are applied.
  - If open, UX copy explains Nicaragua focus.
- Suggested files: `src/components/map/MvpProviderMap.tsx`, docs.
- Notes: Not a blocker.

### Card: Move search intent/filtering to shared adapter

- Goal: Avoid scattered DB-shape assumptions.
- Description: Search page performs frontend intent extraction/ranking over provider view model.
- Assigned area: Frontend / Backend
- Priority: P2
- Difficulty: Medium
- Dependencies: Normalized provider API.
- Acceptance criteria:
  - View model mapping is centralized.
  - Server supports core filters.
  - Frontend ranking remains explainable.
- Suggested files: `src/pages/SearchPage.tsx`, `src/lib/providers-service.ts`.
- Notes: Improves scalability.

## 9. UI/UX Fixes

### Card: Update README and onboarding docs to current auth/demo flow

- Goal: Reduce setup confusion.
- Description: README still references older bootstrap admin variable.
- Assigned area: Documentation
- Priority: P1
- Difficulty: Easy
- Dependencies: None.
- Acceptance criteria:
  - README explains DB seed users.
  - README explains demo switcher variable.
  - README explains Docker DB.
  - Old `VITE_BOOTSTRAP_ADMIN` text is removed or marked legacy.
- Suggested files: `README.md`, `.env.example`.
- Notes: Good immediate task.

### Card: Review demo switcher layout over map/mobile

- Goal: Prevent dev tool from blocking map interactions.
- Description: Switcher is fixed bottom-right and can overlap mobile UI.
- Assigned area: Frontend / QA
- Priority: P3
- Difficulty: Easy
- Dependencies: Demo mode.
- Acceptance criteria:
  - Switcher has collapse/minimize.
  - Does not cover primary map preview buttons on mobile.
  - Only appears in dev.
- Suggested files: `src/components/dev/DemoProfileSwitcher.tsx`, `src/index.css`.
- Notes: Dev-only but affects manual QA.

## 10. Testing and QA

### Card: Add npm scripts for existing test contracts

- Goal: Make verification repeatable.
- Description: Scripts exist but are not exposed under `package.json`.
- Assigned area: QA / Documentation
- Priority: P1
- Difficulty: Easy
- Dependencies: None.
- Acceptance criteria:
  - `npm run test:contracts` runs TS contract scripts.
  - `npm run test:map` documented for Playwright.
  - README lists required dev server for Playwright scripts.
- Suggested files: `package.json`, `README.md`.
- Notes: Non-destructive.

### Card: Add API smoke test for seeded DB flow

- Goal: Verify login → search → request → chat → completion → review with real DB.
- Description: Current Playwright/localStorage tests do not fully validate DB-backed route security.
- Assigned area: QA / Backend
- Priority: P1
- Difficulty: Hard
- Dependencies: Protected request routes.
- Acceptance criteria:
  - Uses seeded users.
  - Creates request to seeded provider.
  - Sends message as both participants.
  - Completes bilaterally.
  - Creates verified review.
- Suggested files: `scripts/`, `server.ts`.
- Notes: Use cleanup or unique test IDs.

## 11. Documentation and Deliverables

### Card: Maintain project state audit after each major branch

- Goal: Keep team aligned.
- Description: Update audit docs when request security/admin workflow changes.
- Assigned area: Documentation / Project coordination
- Priority: P2
- Difficulty: Easy
- Dependencies: Major features merged.
- Acceptance criteria:
  - Current audit is updated.
  - Trello backlog is pruned.
  - Dependency doc reflects completed blockers.
- Suggested files: `docs/current-project-state-audit.md`, `docs/trello-ready-task-backlog.md`, `docs/task-dependencies-and-execution-order.md`.
- Notes: Avoid stale planning.
