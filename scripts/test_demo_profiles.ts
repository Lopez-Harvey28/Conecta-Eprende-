import assert from "node:assert/strict";
import { demoProfiles, demoProviders } from "../src/auth/demoProfiles";
import { seedAccounts, seedClientProfiles, seedOffers, seedProviders, seedRoleAssignments } from "../src/lib/mvp-data";

const requiredLabels=["Requester only","Provider draft","Active provider","Suspended provider","Admin reviewer","Super admin"];
for(const label of requiredLabels){
  assert.ok(demoProfiles.some(profile=>profile.label===label),`Missing demo profile: ${label}`);
}

for(const profile of demoProfiles){
  assert.ok(seedAccounts.some(account=>account.id===profile.user.id),`Missing account for ${profile.label}`);
  assert.ok(seedClientProfiles.some(client=>client.id===profile.user.requesterProfileId),`Missing requester profile for ${profile.label}`);
  for(const role of profile.user.roles){
    assert.ok(seedRoleAssignments.some(assignment=>assignment.userId===profile.user.id&&assignment.role===role),`Missing role ${role} for ${profile.label}`);
  }
}

const draft=demoProviders.find(provider=>provider.id==="provider_draft_demo");
const active=demoProviders.find(provider=>provider.id==="provider_active_demo");
const suspended=demoProviders.find(provider=>provider.id==="provider_suspended_demo");
assert.equal(draft?.profileStatus,"DRAFT");
assert.equal(active?.profileStatus,"ACTIVE");
assert.equal(suspended?.profileStatus,"SUSPENDED");
assert.ok(seedProviders.some(provider=>provider.id==="provider_active_demo"));
assert.ok(seedOffers.some(offer=>offer.providerId==="provider_active_demo"&&offer.status==="ACTIVE"));
assert.ok(!seedOffers.some(offer=>offer.providerId==="provider_suspended_demo"&&offer.status==="ACTIVE"));
assert.ok(demoProviders.some(provider=>provider.trustScore>=90));
assert.ok(demoProviders.some(provider=>provider.trustScore<=40));
assert.ok(demoProviders.some(provider=>provider.suspiciousActivityPenalty&&provider.suspiciousActivityPenalty>0));

console.log("DEMO_PROFILE_SWITCHER_CONTRACT_OK");
