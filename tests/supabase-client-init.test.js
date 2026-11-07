import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

test("Supabase Client — Initialises singleton when environment variables are supplied", () => {
  const script = `
    import assert from "node:assert/strict";
    import clientDefault, { supabase, isSupabaseConfigured, getSupabase } from "./src/services/supabase/client.js";

    assert.equal(isSupabaseConfigured, true, "Should be configured when env is set");
    assert.ok(supabase, "Client instance should exist");
    assert.equal(supabase, clientDefault, "Default export should match named export");
    assert.equal(getSupabase(), supabase, "getSupabase should return singleton");
    assert.equal(typeof supabase.from, "function", "Client should have query builder API");
    assert.equal(typeof supabase.storage, "object", "Client should have storage API");
    assert.equal(typeof supabase.auth, "object", "Client should have auth API");
    console.log("CLIENT_INIT_SUCCESS");
  `;

  const output = execSync("node --input-type=module", {
    input: script,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: "https://mock-project-id.supabase.co",
      VITE_SUPABASE_ANON_KEY: "mock-anon-key-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    },
    encoding: "utf-8",
  });

  assert.match(output, /CLIENT_INIT_SUCCESS/);
});

test("Supabase Client — Missing configuration warning without crash", () => {
  const script = `
    import assert from "node:assert/strict";
    import clientDefault, { supabase, isSupabaseConfigured, getSupabase } from "./src/services/supabase/client.js";

    assert.equal(isSupabaseConfigured, false, "Should be false when env is omitted");
    assert.equal(supabase, null, "Client should be null");
    assert.equal(clientDefault, null, "Default export should be null");
    assert.throws(() => getSupabase(), /Supabase client is not initialized/);
    console.log("SAFE_FALLBACK_SUCCESS");
  `;

  const output = execSync("node --input-type=module", {
    input: script,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
    },
    encoding: "utf-8",
  });

  assert.match(output, /SAFE_FALLBACK_SUCCESS/);
});

