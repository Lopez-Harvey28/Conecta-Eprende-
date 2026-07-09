# Requester / provider profile behavior

## Requester account (`/me`)

- Shows account identity, email state, requester activity metrics, recent requests, and direct actions to search providers or open all requests.
- Does not simulate a provider profile. If the user has no provider profile, the page offers a clear optional CTA to create one.
- Request lists are loaded from `/api/quotes` and require the authenticated session. The backend returns every thread where the user is either the requester or owns the provider profile.

## Provider account (`/me`)

- Shows the same account identity block plus provider management: public profile summary, completeness checklist, catalog metrics, request activity, trust and profile-quality cards.
- Provider request activity uses the same `/api/quotes` participant feed, so mixed requester/provider accounts see a consistent conversation history.

## Public provider and quote flow

- Users cannot request a quote from their own provider profile. Public profile, search cards, map preview, and offer details switch from quote CTAs to edit CTAs when the provider belongs to the current user.
- Quote creation, message author role, quote updates, acceptance, confirmations, and closures are authorized by the backend from the authenticated session and thread participants.
- The frontend no longer sends `senderId`, `authorId`, or an authoritative `authorRole` for quote messages.
- Closed and completed conversations remain in the participant feed unless a future archive/delete feature explicitly hides them.

## Developer testing panel

- The demo profile switcher only renders in development when `VITE_ENABLE_DEMO_PROFILE_SWITCHER=true`.
- The panel is collapsible to avoid covering the interactive provider map during manual tests.

## Formalization scope

- Legal formalization/MIPYME status is not an active MVP feature.
- Legacy fields can remain in persisted/demo data for compatibility, but primary navigation, search filters, public provider profiles, and profile-editing forms should not expose them as supported verification.
- `/formalization` is a roadmap-only explainer, not a transactional or verification flow.
