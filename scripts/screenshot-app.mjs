import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const outDir = path.resolve("tmp-screenshots");
fs.mkdirSync(outDir, { recursive: true });

const E2E_TEST_MODE = process.env.E2E_TEST_MODE ?? "true";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const page = await ctx.newPage();

// Sign up a fresh user
const ts = Date.now();
const email = `test-${ts}-${Math.random().toString(16).slice(2, 8)}@aiallapp.test`;
await page.goto("http://localhost:3000/signup");
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', "test-password-123");
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 20000 });

// Dashboard screenshot
await page.screenshot({ path: path.join(outDir, "dashboard-dark.png"), fullPage: true });
console.log("saved dashboard-dark.png");

// Learn catalog
await page.goto("http://localhost:3000/learn");
await page.waitForLoadState("networkidle");
await page.screenshot({ path: path.join(outDir, "learn-dark.png"), fullPage: true });
console.log("saved learn-dark.png");

// First lesson page (with actions)
await page.goto("http://localhost:3000/learn/foundations-01-what-is-ai");
await page.waitForLoadState("networkidle");
await page.screenshot({ path: path.join(outDir, "lesson-dark.png"), fullPage: true });
console.log("saved lesson-dark.png");

await browser.close();
