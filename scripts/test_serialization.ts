import assert from "node:assert/strict";
import { createMarketplaceSnapshot, stringifyMarketplaceSnapshot } from "../src/lib/serialization";
import { parseIdentityData } from "../src/lib/identity";

const snapshot=createMarketplaceSnapshot();
const encoded=stringifyMarketplaceSnapshot();
const decoded=JSON.parse(encoded) as Record<string,unknown>;

assert.equal(snapshot.schemaVersion,1);
assert.equal(snapshot.identity.schemaVersion,1);
assert.ok(snapshot.identity.accounts.length>=2);
assert.ok(snapshot.providerProfiles.every(profile=>snapshot.identity.accounts.some(account=>account.id===profile.ownerUserId)));
assert.ok(!("session" in decoded),"Authentication session must not be serialized with domain data");
assert.ok(!("currentUser" in decoded),"Derived current-user view must not be serialized");
assert.deepEqual(parseIdentityData(snapshot.identity),snapshot.identity);

console.log("SERIALIZATION_CONTRACT_OK");
