# Database normalization migration plan

## Tables/models added

- `Department`
- `City`
- `Category`
- `ProviderCategory`
- `CatalogItemCategory`
- `ProviderBusinessHour`
- `ProviderDeliveryOption`
- `ProviderMetrics`
- `CatalogItemMetrics`
- `ReviewAnalysis`
- `TrustScoreSnapshot`
- `RiskReport`
- `QuoteOffer`
- `FormalizationStep`

## Tables/models kept for compatibility

- `QuoteThread`
- `QuoteMessage`
- `TrustScore`
- `FormalizationChecklist`

These are intentionally not renamed in the physical database in this step.

## Fields added

- `Provider.cityId`
- `CatalogItem.cityId`
- `Review.requestId` now has a Prisma relation/FK to `QuoteThread`.

## Fields moved conceptually, not removed yet

- Location source of truth: `City` + `Department`; legacy `Provider.city`, `Provider.department`, and `CatalogItem.city` remain as compatibility fields.
- Category source of truth: `Category` links; legacy category strings remain as compatibility fields.
- Provider cached metrics: `ProviderMetrics`; legacy metric columns remain for compatibility.
- Catalog cached metrics: `CatalogItemMetrics`; legacy counters remain for compatibility.
- Review derived calculations: `ReviewAnalysis`; legacy `Review.sentiment` remains for compatibility.
- Trust calculation history: `TrustScoreSnapshot`; current `TrustScore` remains as latest-score compatibility.

## Compatibility adapters needed

- Provider search/profile maps normalized relations into `city`, `category`, `mainCategory`, `trustScore`, `responseTimeHrs`, and `completedRequests`.
- Catalog service maps normalized `cityRef`, `categoryLinks`, and `metrics` into legacy view fields.
- Request/chat keeps current response shape while preserving request-linked chat behavior.

## Seed data changes

Seed now creates:

- Nicaraguan departments and cities used by the app.
- Categories and parent/child category links.
- Provider/category and catalog/category joins.
- Provider and catalog metrics.
- Trust score snapshots.
- Risk reports for low-trust demo data only, without private data.
- Quote offers linked to existing request conversations.
- Formalization roadmap steps only.

## Backend route changes

- Provider create/update upserts normalized city/category references.
- Catalog item create/update upserts normalized city/category references and metrics.
- Review create now requires a completed request, validates requester/provider participation, prevents self-review, links `Review.requestId`, and creates `ReviewAnalysis`.

## Risks

- Existing local reviews with invalid non-null `requestId` would block the FK migration. Current seed uses valid IDs.
- Existing duplicate reviews for the same `(requestId, providerId, reviewerId)` would block the unique index.
- Legacy data created before this migration may have `cityId`/category links null until seed/backfill or edit.

## Rollback strategy

Because this migration is additive, rollback is:

1. Revert the code commit.
2. Drop added FKs, indexes, tables, and nullable columns if needed.
3. Keep legacy fields untouched; existing app behavior can continue on pre-normalized columns.

Do not reset the database unless the developer confirms it is a disposable local database.
