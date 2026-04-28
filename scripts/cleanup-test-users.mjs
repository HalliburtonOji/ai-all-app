// scripts/cleanup-test-users.mjs
//
// !!! IMPORTANT — SECURITY NOTE !!!
//
// This script uses the Supabase **SERVICE ROLE** key, which BYPASSES Row Level
// Security and can read or modify ANY data in your database. It must NEVER be:
//
//   - Imported from any code under src/ (the Next.js app)
//   - Prefixed with NEXT_PUBLIC_ (which would ship it to the browser)
//   - Committed to git in plaintext (it lives only in GitHub Secrets / a local
//     .env that's gitignored)
//
// This file runs only in CI (GitHub Actions) or manually from the developer's
// terminal. The cleanup deletes every user whose email matches the test pattern
// `test-<timestamp>-<hex>@aiallapp.test`. Their projects cascade-delete via the
// foreign key in the `projects` table.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Match exactly the pattern emitted by tests/e2e/helpers/auth.ts:makeTestUser()
const TEST_EMAIL_PATTERN = /^test-\d+-[a-f0-9]+@aiallapp\.test$/;

async function listAllUsers() {
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    if (!data.users || data.users.length === 0) break;
    all.push(...data.users);
    if (data.users.length < perPage) break;
    page++;
  }
  return all;
}

async function main() {
  console.log("Cleanup: scanning for test users…");
  const users = await listAllUsers();
  const testUsers = users.filter(
    (u) => u.email && TEST_EMAIL_PATTERN.test(u.email),
  );

  if (testUsers.length === 0) {
    console.log("Cleanup: no test users found, nothing to do.");
    return;
  }

  console.log(`Cleanup: found ${testUsers.length} test users to delete.`);

  let deleted = 0;
  let failed = 0;
  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  ✗ ${user.email}: ${error.message}`);
      failed++;
    } else {
      deleted++;
    }
  }

  console.log(`Cleanup: deleted ${deleted}, failed ${failed}.`);
  // Don't fail the workflow on cleanup errors — tests already passed/failed.
}

main().catch((err) => {
  console.error("Cleanup script crashed:", err);
  // Exit 0 so cleanup failure doesn't mask the real test result.
  process.exit(0);
});
