# Database normalization summary

## What changed

- Added normalized location tables: `Department`, `City`.
- Added normalized category tables: `Category`, `ProviderCategory`, `CatalogItemCategory`.
- Added provider/catalog metrics tables.
- Added review analysis, trust-score snapshots, risk reports, quote offers, and formalization roadmap steps.
- Added nullable `cityId` foreign keys to providers and catalog items.
- Added a real `Review.requestId` relation to request conversations.
- Updated seed data to populate normalized tables.
- Updated backend provider/catalog/review write paths and mapping adapters.

## Why it changed

The previous schema repeated location, category, and cached metric values directly in source profile/catalog tables. The new structure moves those concepts toward 3NF while preserving the current MVP UI and routes.

## Compatibility adapters

The app still returns familiar fields to the frontend:

- `provider.city`
- `provider.category`
- `provider.mainCategory`
- `provider.trustScore`
- `catalogItem.city`
- `catalogItem.category`
- `catalogItem.subcategory`

Those values now prefer normalized relations when available and fall back to legacy columns otherwise.

## Seed data

`prisma/seed.ts` now seeds departments, cities, categories, joins, metrics, request-linked quote offers, review analysis, trust snapshots, risk reports, and formalization roadmap support.

## Backend enforcement added

- Reviews require an existing completed request.
- Reviewer must be the requester.
- Reviewer cannot review their own provider profile.
- Duplicate reviews are constrained by request/provider/reviewer.

## Still pending for a future migration

- Rename or fully replace `QuoteThread`/`QuoteMessage` with `Request`/`RequestMessage`.
- Backfill all non-seeded legacy data into normalized tables.
- Remove legacy duplicated columns after frontend and APIs no longer depend on them.
- Add a dedicated admin UI for reviewing `RiskReport` records.

## Destructive migrations

None in this step. The migration is additive and keeps legacy fields/tables.
