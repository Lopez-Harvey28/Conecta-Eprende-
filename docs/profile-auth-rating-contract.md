# Profile, auth, rating and admin contract

## One login system

`UserAccount` is the login identity. A user signs in once, then acts through separate contexts:

- `RequesterProfile`: buyer/requester identity for sending and tracking requests.
- `ProviderProfile`: public seller/provider identity, catalog, rating and trust score.
- Admin roles: internal permissions assigned to the user; never a public profile.

## Roles

Serializable role values:

- `REQUESTER`
- `PROVIDER`
- `ADMIN_REVIEWER`
- `SUPER_ADMIN`

Normal users must not self-upgrade to admin roles. For the MVP, the default bootstrap session uses `user-provider` as the admin-capable account. Later login middleware should return these roles from `/api/auth/session` or `/me`.

## Provider can also request providers

A provider profile owner can still send requests to other providers. The only blocked case is sending a request to their own provider profile.

## Rating ownership

Provider rating belongs only to `ProviderProfile`. Requester behavior does not change provider reputation.

Verified review rules:

- request exists;
- request status is `COMPLETED`;
- both requester and provider confirmed completion;
- reviewer participated in the request;
- reviewed profile is the target provider profile;
- reviewer has not already reviewed the same request;
- reviewer cannot review their own provider profile.

## Trust score formula

Trust score is calculated from backend-ready inputs:

```text
(profile_complete * 10)
+(contact_verified * 10)
+(min(requests_responded / 5, 1) * 15)
+(min(requests_completed / 10, 1) * 25)
+((avg_review_score / 5) * 25)
+(response_time_score * 10)
+(account_age_factor * 5)
- suspicious_activity_penalty
```

The final score is clamped between `0` and `100`.

## Risk reports

Risk scoring uses aggregate behavior only and must not expose phone numbers, legal documents, full chat content, exact private addresses or unnecessary personal data. Scores of `70+` should generate or prepare an internal manual-review report, not automatically hide or delete a provider.

## Frontend/backend API contract

- `GET /me`
- `GET /providers`
- `GET /providers/:id`
- `POST /providers`
- `PATCH /providers/:id`
- `GET /requests`
- `POST /requests`
- `PATCH /requests/:id/status`
- `POST /requests/:id/confirm-completion`
- `POST /requests/:id/reviews`
- `GET /providers/:id/reviews`
- `GET /providers/:id/trust-score`
- `GET /admin/risk-reports`
- `PATCH /admin/risk-reports/:id`

Current MVP endpoints may still use in-memory data, but authorization must be enforced again in the backend once real login/session middleware is connected.

## Developer manual testing mode

`VITE_ENABLE_DEMO_PROFILE_SWITCHER=true` enables a temporary local switcher for profile-state testing. It reuses the frontend auth-store session boundary and demo seed data, but it is not real authentication and must not be used to grant real permissions. Keep it disabled in production.
