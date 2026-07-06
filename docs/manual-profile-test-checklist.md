# Manual profile test checklist

## Enable locally

Set the flag before running the dev server:

```bash
VITE_ENABLE_DEMO_PROFILE_SWITCHER=true
```

The switcher is a temporary development tool. It does not represent real authentication, does not grant real backend permissions, and must be disabled before production. Backend authorization remains required.

## Checklist

- [ ] Switch to Requester only.
- [ ] Requester cannot access provider dashboard as an existing provider.
- [ ] Requester can search providers.
- [ ] Requester can create/send request.
- [ ] Requester sees create provider profile CTA.
- [ ] Switch to Provider draft.
- [ ] Provider draft can edit profile.
- [ ] Provider draft does not appear as active provider unless previewing.
- [ ] Switch to Active provider.
- [ ] Active provider can view provider dashboard.
- [ ] Active provider can view received requests.
- [ ] Active provider can send request to another provider.
- [ ] Provider rating is shown but not editable from frontend.
- [ ] Switch to Suspended provider.
- [ ] Suspended provider shows restricted state.
- [ ] Switch to Admin reviewer.
- [ ] Admin reviewer can view risk reports.
- [ ] Admin reviewer cannot assign admin roles.
- [ ] Switch to Super admin.
- [ ] Super admin can access admin area.
- [ ] Super admin cannot be created from public UI.
- [ ] Disable `VITE_ENABLE_DEMO_PROFILE_SWITCHER`.
- [ ] Demo switcher disappears.
