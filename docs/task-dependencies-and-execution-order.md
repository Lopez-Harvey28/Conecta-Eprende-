# Task Dependencies and Execution Order

## Task Dependencies

- Request/chat security depends on real auth cookies and user IDs from `/api/auth/me`.
- Verified reviews depend on completed requests, and completed requests depend on reliable participant validation.
- Trust score depends on provider profile completeness, completed requests, verified reviews, response metrics, account age, and risk penalties.
- Admin risk review depends on DB-backed `RiskReport` data and backend-enforced admin permissions.
- Super admin behavior depends on a persistent role model that can distinguish `ADMIN_REVIEWER` and `SUPER_ADMIN`.
- Provider category/city display depends on normalized `Category`, `ProviderCategory`, `Department`, and `City` relations, with legacy fallback during migration.
- Search/map QA depends on seeded providers being real DB records, not only frontend mock cards.
- Provider lifecycle states depend on DB-backed provider/account status.
- Removing legacy DB fields depends on completing adapter migration and backfill.
- Playwright QA scripts depend on a running local dev server.

## Recommended Execution Order

### Phase 1 — Stabilize data and architecture

What should be done:

- Protect request/chat backend routes.
- Remove anonymous request sender fallback.
- Prevent own-provider requests in backend.
- Decide persistent role assignment model.
- Add package scripts for existing test contracts.

Why now:

- Request/chat is the center of the MVP. If it is insecure or inconsistent, reviews, trust, admin risk, and QA results are unreliable.

Who can work in parallel:

- Backend/database teammate: request route protection and role model.
- QA/testing teammate: contract scripts and API smoke-test design.
- Documentation teammate: README updates.

What should not start yet:

- Full admin moderation UI beyond seeded reports.
- Removing legacy normalized fields.
- Advanced trust-score automation.

### Phase 2 — Fix requester/provider flows

What should be done:

- Build a useful requester dashboard.
- Fix `useState` side effects in request pages.
- Fix bilateral completion UI roles.
- Add provider lifecycle status.
- Align catalog item type filters.

Why now:

- Once auth/request ownership is reliable, the team can safely polish role-specific experiences.

Who can work in parallel:

- Frontend teammate: requester dashboard, completion UI, catalog filters.
- Backend/database teammate: provider lifecycle status.
- QA teammate: manual matrix for requester/provider/admin profiles.

What should not start yet:

- Super admin role assignment UI unless role persistence is already done.

### Phase 3 — Fix request/chat/review cycle

What should be done:

- Add route-level tests for review rules.
- Improve duplicate-review handling.
- Recalculate provider metrics/trust after review/completion events.
- Add DB-backed end-to-end smoke test.

Why now:

- This locks the product’s trust loop: request → chat → completion → verified review → score.

Who can work in parallel:

- Backend teammate: review/trust recalculation.
- QA teammate: API and Playwright tests.
- Frontend teammate: review UX errors and states.

What should not start yet:

- Public claims that trust score is production-grade until recalculation and risk penalties are complete.

### Phase 4 — Add/admin risk workflow

What should be done:

- Implement `/api/admin/risk-reports`.
- Connect `AdminReportsPage` to DB API.
- Add audit log for admin actions.
- Define reviewer vs super admin permissions.

Why now:

- Risk/admin features depend on trustworthy request/review data and persisted role model.

Who can work in parallel:

- Backend/database teammate: admin routes and audit log.
- Frontend teammate: admin page API integration.
- QA teammate: permission tests.

What should not start yet:

- Automatic provider suspension/hiding unless moderation policy is defined.

### Phase 5 — Polish UI, map, and QA

What should be done:

- Make availability filter functional.
- Decide/enforce Nicaragua map bounds.
- Review demo switcher mobile overlap.
- Consider bundle splitting for map/admin/chat.

Why now:

- These polish issues matter, but they should not distract from request/security/trust blockers.

Who can work in parallel:

- Frontend teammate: search/map UI.
- Design/documentation teammate: UX copy and map behavior decision.
- QA teammate: mobile map regression tests.

What should not start yet:

- Major visual redesign unless functionality blockers are closed.

### Phase 6 — Final documentation and deliverables

What should be done:

- Update README and setup docs.
- Update current project audit after each completed phase.
- Prune Trello backlog.
- Prepare release/test checklist.

Why now:

- Documentation should reflect the actual implemented system, not intended design.

Who can work in parallel:

- Documentation teammate and project coordinator.

What should not start yet:

- Merging stale docs without checking the final app state.

## Suggested Team Task Division

### Frontend teammate

Can start immediately:

- Fix `useState` side effects in request pages.
- Fix bilateral completion UI role gating.
- Align catalog item filters.
- Make availability filter functional.

Should wait:

- Admin report API integration until backend routes exist.
- Super admin UI until role model is persistent.

### Backend/database teammate

Can start immediately:

- Protect request/chat routes.
- Remove anonymous sender fallback.
- Reject own-provider requests.
- Design persistent role assignment.

Should wait:

- Removing legacy DB fields until adapters/backfill are complete.

### QA/testing teammate

Can start immediately:

- Add npm scripts for contract tests.
- Expand manual test checklist around real DB seed users.
- Design API smoke test for login/search/request/chat/review.

Should wait:

- Final automated review tests until route protection is implemented.

### Documentation/design teammate

Can start immediately:

- Update README/env docs.
- Document demo switcher usage and seed accounts.
- Create role/context diagrams for requester/provider/admin.

Should wait:

- Final admin workflow docs until backend admin routes exist.

### Project coordinator

Can start immediately:

- Create Trello cards from `docs/trello-ready-task-backlog.md`.
- Assign Phase 1 blockers first.
- Track dependencies between backend security and frontend QA.

Should wait:

- Scheduling polish/admin UI work before request/chat security is assigned.
