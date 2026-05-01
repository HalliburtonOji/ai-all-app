#!/usr/bin/env node
// scripts/lighthouse.mjs
//
// Run Lighthouse against the live deploy (or a custom URL) and print
// scores for each top route. Per-route scores go to
// /lighthouse-reports/{timestamp}/{route}.html for inspection; a
// summary table prints to stdout.
//
// Usage:
//   npm run lighthouse              # against https://ai-all-app.vercel.app
//   npm run lighthouse -- http://localhost:3000   # against local
//
// Requires Chrome installed locally (Lighthouse spawns its own
// headless Chrome).

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const baseUrl =
  process.argv[2] ?? process.env.LH_BASE_URL ?? "https://ai-all-app.vercel.app";

// Public, cookie-free routes only — Lighthouse doesn't authenticate.
// The auth-gated routes (dashboard, project detail, studio panels)
// just bounce to /login, which is fine to audit too.
const ROUTES = [
  { name: "homepage", path: "/" },
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
];

const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const reportDir = join(process.cwd(), "lighthouse-reports", ts);
if (!existsSync(reportDir)) await mkdir(reportDir, { recursive: true });

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox"],
});

const results = [];

try {
  for (const route of ROUTES) {
    const url = baseUrl + route.path;
    process.stdout.write(`Running Lighthouse on ${url} … `);
    const lhr = await lighthouse(url, {
      port: chrome.port,
      output: "html",
      logLevel: "error",
      onlyCategories: [
        "performance",
        "accessibility",
        "best-practices",
        "seo",
      ],
    });
    if (!lhr) {
      console.log("FAILED");
      continue;
    }
    const scores = {};
    for (const [k, v] of Object.entries(lhr.lhr.categories)) {
      scores[k] = Math.round((v.score ?? 0) * 100);
    }
    results.push({ name: route.name, url, scores });
    await writeFile(join(reportDir, `${route.name}.html`), lhr.report);
    console.log("done");
  }
} finally {
  // Windows occasionally fails to clean up Chrome's temp profile due
  // to file-lock races. Swallow it — the audits succeeded by this point.
  try {
    await chrome.kill();
  } catch (e) {
    if ((e?.code ?? "") !== "EPERM") throw e;
  }
}

// Print summary table
console.log("");
console.log(`Lighthouse summary — ${baseUrl}`);
console.log("─".repeat(78));
console.log(
  "Route".padEnd(14) +
    "Perf".padStart(8) +
    "A11y".padStart(8) +
    "Best".padStart(8) +
    "SEO".padStart(8),
);
console.log("─".repeat(78));
for (const r of results) {
  const fmt = (n) => {
    const s = String(n).padStart(8);
    if (n >= 90) return `\x1b[32m${s}\x1b[0m`;
    if (n >= 50) return `\x1b[33m${s}\x1b[0m`;
    return `\x1b[31m${s}\x1b[0m`;
  };
  console.log(
    r.name.padEnd(14) +
      fmt(r.scores.performance) +
      fmt(r.scores.accessibility) +
      fmt(r.scores["best-practices"]) +
      fmt(r.scores.seo),
  );
}
console.log("─".repeat(78));
console.log(`Reports: ${reportDir}/`);
