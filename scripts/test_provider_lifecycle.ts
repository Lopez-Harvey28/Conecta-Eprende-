import assert from "node:assert/strict";
import {
  PROVIDER_STATUSES,
  VALID_TRANSITIONS,
  isPubliclyVisible,
  canReceiveQuotes,
  canTransition,
  getProviderStatusLabel,
} from "../src/lib/providers-service";

const ALL_STATUSES = PROVIDER_STATUSES;

assert.equal(ALL_STATUSES.length, 6, "Should have exactly 6 provider statuses");
assert.ok(ALL_STATUSES.includes("DRAFT"), "Missing DRAFT");
assert.ok(ALL_STATUSES.includes("ACTIVE"), "Missing ACTIVE");
assert.ok(ALL_STATUSES.includes("INACTIVE"), "Missing INACTIVE");
assert.ok(ALL_STATUSES.includes("TEMPORARILY_RESTRICTED"), "Missing TEMPORARILY_RESTRICTED");
assert.ok(ALL_STATUSES.includes("SUSPENDED"), "Missing SUSPENDED");
assert.ok(ALL_STATUSES.includes("BANNED"), "Missing BANNED");

const publiclyVisible = ["ACTIVE", "TEMPORARILY_RESTRICTED"];
for (const status of ALL_STATUSES) {
  const expected = publiclyVisible.includes(status);
  assert.equal(
    isPubliclyVisible(status as any),
    expected,
    `isPubliclyVisible(${status}) should be ${expected}`,
  );
}

const canReceiveQuotesStatuses = ["ACTIVE", "TEMPORARILY_RESTRICTED"];
for (const status of ALL_STATUSES) {
  const expected = canReceiveQuotesStatuses.includes(status);
  assert.equal(
    canReceiveQuotes(status as any),
    expected,
    `canReceiveQuotes(${status}) should be ${expected}`,
  );
}

const transitionMatrix: Record<string, string[]> = {
  DRAFT: ["DRAFT", "ACTIVE", "INACTIVE"],
  ACTIVE: ["ACTIVE", "INACTIVE", "TEMPORARILY_RESTRICTED", "SUSPENDED", "BANNED"],
  INACTIVE: ["INACTIVE", "ACTIVE", "TEMPORARILY_RESTRICTED", "SUSPENDED", "BANNED"],
  TEMPORARILY_RESTRICTED: ["TEMPORARILY_RESTRICTED", "ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"],
  SUSPENDED: ["SUSPENDED", "ACTIVE", "INACTIVE", "BANNED"],
  BANNED: ["BANNED"],
};

for (const from of ALL_STATUSES) {
  for (const to of ALL_STATUSES) {
    const expected = transitionMatrix[from]?.includes(to) ?? false;
    assert.equal(
      canTransition(from as any, to as any),
      expected,
      `canTransition(${from} → ${to}) should be ${expected}`,
    );
  }
}

for (const status of ALL_STATUSES) {
  const label = getProviderStatusLabel(status as any);
  assert.ok(typeof label === "string" && label.length > 0, `getProviderStatusLabel(${status}) should return a non-empty string`);
  assert.ok(
    ["Borrador", "Activo", "Inactivo", "Restringido temporalmente", "Suspendido", "Baneado"].some(l => l === label),
    `getProviderStatusLabel(${status}) returned unexpected label: ${label}`,
  );
}

for (const status of ALL_STATUSES) {
  const transitions = VALID_TRANSITIONS[status as keyof typeof VALID_TRANSITIONS];
  assert.ok(Array.isArray(transitions), `${status} should have an array of valid transitions`);
  if (transitions) {
    assert.ok(
      transitions.every(t => ALL_STATUSES.includes(t as any)),
      `All valid transitions from ${status} should be valid statuses`,
    );
    assert.ok(
      !transitions.slice(1).includes(status as any),
      `No status should be able to transition to itself (${status}) except as self-idempotent`,
    );
  }
}

console.log("PROVIDER_LIFECYCLE_CONTRACT_OK");