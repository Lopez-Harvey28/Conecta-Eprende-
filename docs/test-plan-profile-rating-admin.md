# Test plan — profile, rating and admin

- Trust score clamps between 0 and 100.
- Trust score safely handles `avgReviewScore = null`.
- Average rating counts only verified reviews.
- Review cannot be created without a completed request.
- Self-review is rejected.
- Provider rating is not affected by requester-only behavior.
- Provider can send request to another provider.
- Normal user cannot access admin dashboard.
- Admin role cannot be self-assigned.
- Risk score returns manual-review recommendation when score is 70 or higher.
