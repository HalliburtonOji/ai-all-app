#!/usr/bin/env node
/**
 * One-off script: generate hero + section images for the new landing
 * page via Replicate FLUX schnell. Saves PNGs to public/landing/.
 *
 * Run with: `node scripts/generate-landing-assets.mjs`
 *
 * Requires REPLICATE_API_TOKEN in .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Replicate from "replicate";

// Load .env.local manually (no dotenv dep on this project for scripts).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}

if (!process.env.REPLICATE_API_TOKEN) {
  console.error("REPLICATE_API_TOKEN missing in .env.local");
  process.exit(1);
}

const outDir = path.resolve(__dirname, "..", "public", "landing");
fs.mkdirSync(outDir, { recursive: true });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

/**
 * Visual identity decisions:
 * - Single warm-cool palette: deep teal + warm amber, against near-black
 *   or off-white backgrounds. Echoes the in-app brand vars.
 * - Abstract / generative geometric forms — NOT illustration of people
 *   working at laptops (cliché). NOT 3D blob (overdone in 2025).
 *   Aim: studio-quality minimal abstract that hints at "system" / "loop"
 *   without being literal.
 * - Soft film grain + matte finish so it doesn't look AI-glossy.
 */
const ASSETS = [
  {
    file: "hero.png",
    aspect: "16:9",
    prompt:
      "A minimal, premium abstract composition. A single softly-glowing teal torus (circular ring) seen at a slight 3-quarter angle, floating in a deep near-black space with a warm amber light bleeding from one side. Subtle film grain, cinematic, editorial photography style, 8k quality, very minimal, generous negative space. Inspired by Linear / Vercel landing aesthetics. No text, no UI, no people. Soft volumetric lighting. Matte finish.",
  },
  {
    file: "loop.png",
    aspect: "1:1",
    prompt:
      "A minimal abstract diagram of a connected loop: five glowing nodes positioned around a circle, connected by soft gradient threads. Each node glows a different muted hue (deep teal, warm amber, soft violet, sage emerald, dusty rose). Set against an off-white background with subtle grain. Editorial print poster aesthetic, generative geometric art. No text, no labels, no people. Very minimal, premium, refined.",
  },
  {
    file: "studio.png",
    aspect: "16:9",
    prompt:
      "An abstract still-life of layered translucent geometric panels — rectangles, soft squares, rounded forms — overlapping in a workshop-like composition. Deep teal and warm amber light passing through translucent panels, casting soft shadows on a matte off-white surface. Editorial photography, premium product still-life lighting, generous negative space. No text, no UI, no people, no laptops. Subtle film grain.",
  },
];

async function generate({ file, aspect, prompt }) {
  const target = path.join(outDir, file);
  if (fs.existsSync(target)) {
    console.log(`✓ ${file} already exists, skipping`);
    return;
  }
  console.log(`→ generating ${file} (${aspect})…`);
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: {
      prompt,
      aspect_ratio: aspect,
      output_format: "png",
      output_quality: 90,
      num_inference_steps: 4,
    },
  });
  // Replicate returns either a URL string or a FileOutput. Normalize.
  const url =
    typeof output === "string"
      ? output
      : Array.isArray(output)
        ? output[0]
        : output?.url
          ? typeof output.url === "function"
            ? output.url()
            : output.url
          : null;
  if (!url) {
    console.error(`  ✗ no URL returned for ${file}`, output);
    return;
  }
  const resolved = typeof url === "string" ? url : String(url);
  const res = await fetch(resolved);
  if (!res.ok) {
    console.error(`  ✗ download failed: ${res.status}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(target, buf);
  console.log(`  ✓ saved ${target} (${(buf.length / 1024).toFixed(1)} KB)`);
}

async function generateWithRetry(asset, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generate(asset);
    } catch (e) {
      const msg = e?.message ?? String(e);
      if (msg.includes("429") || msg.toLowerCase().includes("throttled")) {
        const wait = 12_000;
        console.warn(
          `  ! ${asset.file} throttled (attempt ${attempt}/${maxAttempts}), waiting ${wait / 1000}s…`,
        );
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      console.error(`  ✗ ${asset.file} failed:`, msg);
      return;
    }
  }
  console.error(`  ✗ ${asset.file} failed after ${maxAttempts} attempts`);
}

for (const asset of ASSETS) {
  await generateWithRetry(asset);
  // Pace: stay below the 6-rpm rate limit at low-credit tier.
  await new Promise((r) => setTimeout(r, 11_000));
}
console.log("done");
