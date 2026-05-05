#!/usr/bin/env node
/**
 * One-off: generate empty-state illustrations for /projects,
 * /community/marketplace, and /wins via Replicate FLUX schnell.
 * Saves PNGs to public/empty-states/.
 *
 * Mirrors the conventions in scripts/generate-landing-assets.mjs —
 * minimal brand-aligned abstracts, retry+pacing for the sub-$5
 * Replicate credit tier.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Replicate from "replicate";

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

const outDir = path.resolve(__dirname, "..", "public", "empty-states");
fs.mkdirSync(outDir, { recursive: true });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const ASSETS = [
  {
    file: "projects.png",
    aspect: "4:3",
    prompt:
      "A minimal abstract still life: a single softly-glowing translucent rectangular frame (like an empty card or window) floating against an off-white background with subtle film grain. A faint warm amber light bleeds through one edge of the frame. Editorial print poster aesthetic, refined, premium, minimal. Generous negative space. No text, no UI, no people.",
  },
  {
    file: "marketplace.png",
    aspect: "4:3",
    prompt:
      "An overhead minimal still life: three small translucent geometric objects (a soft circle, a thin rectangle, a small triangle) arranged loosely on an off-white surface with soft shadows. One object glows faintly teal. Editorial photography, generous negative space, premium product still-life lighting, very minimal. No text, no UI, no people.",
  },
  {
    file: "wins.png",
    aspect: "4:3",
    prompt:
      "A minimal abstract composition: a soft glowing teal halo or spotlight centred on an off-white surface, with a single thin warm amber ring around it. Editorial print poster, refined, premium, minimal. Generous negative space. No text, no UI, no people, no trophies.",
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
}

for (const asset of ASSETS) {
  await generateWithRetry(asset);
  await new Promise((r) => setTimeout(r, 11_000));
}
console.log("done");
