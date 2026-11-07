import test from "node:test";
import assert from "node:assert/strict";

// Test 1: Role Normalization
test("Auth Service — accountKindFromRole normalizes legacy and modern role strings", async () => {
  const { accountKindFromRole } = await import("../src/services/auth/index.js");

  assert.equal(accountKindFromRole("admin"), "admin");
  assert.equal(accountKindFromRole("super_admin"), "admin");
  assert.equal(accountKindFromRole("administrator"), "admin");

  assert.equal(accountKindFromRole("owner"), "owner");
  assert.equal(accountKindFromRole("landlord"), "owner");
  assert.equal(accountKindFromRole("property_owner"), "owner");

  assert.equal(accountKindFromRole("agent"), "agent");
  assert.equal(accountKindFromRole("agent_pending"), "agent");

  assert.equal(accountKindFromRole("user"), "user");
  assert.equal(accountKindFromRole("renter"), "user");
  assert.equal(accountKindFromRole(null), "user");
  assert.equal(accountKindFromRole(undefined), "user");
  assert.equal(accountKindFromRole(""), "user");
});

// Test 2: Account Kind Labels
test("Auth Service — accountKindLabel returns proper human-readable labels", async () => {
  const { accountKindLabel } = await import("../src/services/auth/index.js");

  assert.equal(accountKindLabel("user"), "Renter");
  assert.equal(accountKindLabel("owner"), "Owner");
  assert.equal(accountKindLabel("admin"), "Admin");
  assert.equal(accountKindLabel("agent"), "Agent");
  assert.equal(accountKindLabel("agent_pending"), "Agent");
});

// Test 3: Listing Owner Authorization Check
test("Auth Service — isListingOwnerRole verifies listing privileges", async () => {
  const { isListingOwnerRole } = await import("../src/services/auth/index.js");

  assert.equal(isListingOwnerRole("owner"), true);
  assert.equal(isListingOwnerRole("admin"), true);
  assert.equal(isListingOwnerRole("agent"), true);
  assert.equal(isListingOwnerRole("user"), false);
  assert.equal(isListingOwnerRole(null), false);
});

// Test 4: Role Mismatch Notice
test("Auth Service — differentEmailRoleMessage outputs descriptive role mismatch text", async () => {
  const { differentEmailRoleMessage } = await import("../src/services/auth/index.js");

  const msg = differentEmailRoleMessage("owner", "user");
  assert.match(msg, /already registered as a Owner/i);
  assert.match(msg, /sign up as a Renter/i);
});

// Test 5: Safe returns when Supabase is unconfigured
test("Auth Service — Methods return safe error objects without crashing when unconfigured", async () => {
  const auth = await import("../src/services/auth/index.js");

  if (!process.env.VITE_SUPABASE_URL) {
    const signInRes = await auth.signInWithEmail({ email: "test@example.com", password: "pwd" });
    assert.equal(signInRes.data, null);
    assert.match(signInRes.error.message, /not configured/);

    const signUpRes = await auth.signUpWithEmail({ email: "test@example.com", password: "pwd", fullName: "User" });
    assert.equal(signUpRes.data, null);
    assert.match(signUpRes.error.message, /not configured/);

    const resetRes = await auth.sendPasswordResetEmail("test@example.com");
    assert.equal(resetRes.data, null);
    assert.match(resetRes.error.message, /not configured/);

    const updateRes = await auth.updateUserPassword("newpassword");
    assert.equal(updateRes.data, null);
    assert.match(updateRes.error.message, /not configured/);

    const profileRes = await auth.fetchUserProfile("uuid-123");
    assert.equal(profileRes.data, null);
    assert.match(profileRes.error.message, /not configured/);

    const signOutRes = await auth.signOut();
    assert.match(signOutRes.error.message, /not configured/);
  }
});

// Test 6: Input parameter validation
test("Auth Service — Validates required arguments", async () => {
  const auth = await import("../src/services/auth/index.js");

  const noIdProfile = await auth.fetchUserProfile("");
  assert.equal(noIdProfile.data, null);
  assert.match(noIdProfile.error.message, /required/);

  const noIdUpsert = await auth.upsertUserProfile("");
  assert.equal(noIdUpsert.data, null);
  assert.match(noIdUpsert.error.message, /required/);

  const noCodeExchange = await auth.exchangeOAuthCode("");
  assert.equal(noCodeExchange.data, null);
  assert.match(noCodeExchange.error.message, /required/);
});

