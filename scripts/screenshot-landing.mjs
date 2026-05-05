import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const outDir = path.resolve("tmp-screenshots");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
async function shoot(name, opts) {
  const ctx = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 900 },
    colorScheme: opts.colorScheme ?? "light",
  });
  const page = await ctx.newPage();
  await page.goto(opts.url, { waitUntil: "networkidle", timeout: 30000 });
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: true });
  await ctx.close();
  console.log("saved", file);
}

await shoot("home-light.png", { url: "http://localhost:3000/", colorScheme: "light" });
await shoot("home-dark.png",  { url: "http://localhost:3000/", colorScheme: "dark" });
await shoot("home-mobile-light.png", {
  url: "http://localhost:3000/",
  viewport: { width: 375, height: 800 },
  colorScheme: "light",
});

await browser.close();
