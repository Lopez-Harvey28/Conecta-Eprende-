# Database normalization audit

Branch: `refactor/normalize-database-3nf`

## Current technology

- Database: PostgreSQL, configured through `DATABASE_URL`.
- Local database runtime: Docker Compose includes a Postgres service.
- ORM: Prisma (`prisma/schema.prisma`, `@prisma/client`).
- Seed source: `prisma/seed.ts`, exposed through `npm run db:seed`.

## Current auth/session models

- `User`
- `Account`
- `Session`
- `RefreshToken`
- `EmailVerificationToken`
- `PasswordResetToken`

`User` remains the login identity. Admin is a role, not a public profile type.

## Current provider/profile models

- `Provider`
- `ProviderPhoto`
- `ProviderMedal`
- `FormalizationChecklist`

Legacy duplicated fields still present for compatibility:

- `Provider.city`
- `Provider.department`
- `Provider.category`
- `Provider.mainCategory`
- `Provider.subcategories`
- `Provider.businessHours`
- `Provider.deliveryOptions`
- `Provider.profileCompleteness`
- `Provider.responseTimeHrs`
- `Provider.completedRequests`

## Current catalog models

- `CatalogItem`
- `EquipmentDetail`
- `CatalogItemPhoto`

Legacy duplicated fields still present for compatibility:

- `CatalogItem.city`
- `CatalogItem.category`
- `CatalogItem.subcategory`
- `CatalogItem.viewCount`
- `CatalogItem.inquiryCount`

## Current request/chat/quote models

- `QuoteThread`
- `QuoteMessage`

The UI already routes these as `/requests`. This normalization keeps physical table names for safety and treats them as request-linked conversations through API/service adapters.

## Current review/rating/trust models

- `Review`
- `TrustScore`

`Review.requestId` existed as a nullable string but did not have a Prisma relation/FK.

## Frontend/API dependencies

The frontend currently expects legacy view fields:

- provider cards: `city`, `category`, `mainCategory`, `trustScore`, `responseTimeHrs`, `completedRequests`
- provider profile: catalog, photos, medals, reviews, trust score
- request pages/chat: quote-thread shaped data from `/api/quotes` and `/api/requests`

The backend now maps normalized relations back into those view fields instead of forcing components to understand DB joins.

## Risky changes detected

- Renaming `QuoteThread`/`QuoteMessage` tables directly would require coordinated changes across routes, stores, pages, seed, and migrations.
- Removing legacy city/category/metrics fields would break current frontend assumptions.
- Making `Review.requestId` required immediately could fail on existing local data with older reviews.
- Resetting the Docker database would be destructive to local manual-test accounts.

## Safe migration strategy

Use additive normalization:

1. Add normalized tables and nullable FK columns.
2. Keep existing legacy columns/tables during the compatibility window.
3. Seed/backfill normalized tables for demo data.
4. Prefer normalized relations in backend mapping when available.
5. Enforce new write paths for providers, catalog items, and reviews.
6. Document that removal of legacy fields is a later migration after the UI/API no longer depend on them.
