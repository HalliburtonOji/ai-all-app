// scripts/smoke-test.ts
//
// AI Smoke Tester — uses Claude (via @anthropic-ai/sdk) as the brain
// and Playwright as the hands to exploratorily test the live deployment.
//
// Reads ANTHROPIC_API_KEY from env. Reads SMOKE_TEST_URL from CLI arg
// or env, defaults to http://localhost:3000. Hard caps:
//
//   - 50,000 input tokens (cumulative across calls, including cache)
//   - 10,000 output tokens (cumulative)
//   - 5 minute wall clock
//
// On exit, writes a markdown report to /smoke-reports/{timestamp}-report.md
// and screenshots to /smoke-reports/screenshots/.
//
// Test users created during the run match the pattern
//   test-<timestamp>-<hex>@aiallapp.test
// which is the same pattern scripts/cleanup-test-users.mjs sweeps.

import Anthropic from "@anthropic-ai/sdk";
import { chromium, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SMOKE_TEST_URL =
  process.argv[2] ?? process.env.SMOKE_TEST_URL ?? "http://localhost:3000";
const MODEL = "claude-sonnet-4-6";

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY env var. Set it in .env.local or export it.");
  process.exit(1);
}

const MAX_INPUT_TOKENS = 50_000;
const MAX_OUTPUT_TOKENS = 10_000;
const MAX_DURATION_MS = 5 * 60 * 1000;
const MAX_ITERATIONS = 60;

const startTime = Date.now();
let totalInputTokens = 0;
let totalOutputTokens = 0;

interface Finding {
  severity: "critical" | "warning" | "cosmetic";
  description: string;
  screenshot?: string;
  url?: string;
}

const findings: Finding[] = [];
const transcript: string[] = [];
const screenshots: string[] = [];
let finishCalled = false;
let finishSummary = "";

const reportDir = join(process.cwd(), "smoke-reports");
const screenshotsDir = join(reportDir, "screenshots");

async function ensureDirs() {
  if (!existsSync(reportDir)) await mkdir(reportDir, { recursive: true });
  if (!existsSync(screenshotsDir)) await mkdir(screenshotsDir, { recursive: true });
}

const SYSTEM_PROMPT = `You are an exploratory smoke tester for "AI All App", a Next.js web app. Your job: drive a real browser to confirm the live deployment works for a real user.

Base URL: ${SMOKE_TEST_URL}

User journeys to cover, roughly in order. Use judgment — if a journey passes smoothly skip ahead, don't re-verify the same thing twice.

1. Sign up a fresh test user. The email MUST match this regex: ^test-\\d+-[a-f0-9]+@aiallapp\\.test$
   GENERATE a unique one each run — don't copy the example below verbatim, it will already exist.
   Build it like: "test-" + current_unix_ms + "-" + 8 random hex chars + "@aiallapp.test"
   Example shape (DO NOT REUSE LITERALLY): test-1730000000000-a1b2c3d4@aiallapp.test
   Password: TestPassword123! (8+ chars).
2. After signup, you'll usually be redirected to /login with a success banner. Log in with the same credentials.
3. Confirm the dashboard loads at /dashboard and greets the user by email.
4. Navigate to /projects. Should show "No projects yet" empty state.
5. Click "+ New Project" → fill name + select a type (e.g. "channel" or "exploration") + optionally description → submit.
6. Verify you land on /projects/<id> showing the project.
7. Click the project name (it's an inline-editable button) to enter edit mode, change the name, save. Confirm the new name shows.
8. Reload the page and confirm the new name persisted.
9. Go back to /projects (link or back button) and confirm the project appears in the list with the right type badge.
10. Open the project, click Delete project, confirm "Yes, delete". Should redirect to /projects with no projects.
11. Log out via the navbar.
12. While logged out, try to navigate to /dashboard — should redirect to /login (security check).

Tools available to you:
- navigate(url): go to a URL or path. Path-only resolves against the base URL.
- click({role, name, exact}): click an element by ARIA role + accessible name.
- fill({name, value}): fill an input by its name attribute (preferred) or label text.
- select_option({name, value}): pick an option in a <select> by name attribute and option value.
- get_page_state(): returns current URL, title, visible text (truncated), and major buttons/links/inputs.
- screenshot({name, why}): capture the page when something looks off or interesting.
- report_issue({severity, description, screenshot_name?}): log a bug. Severities: critical | warning | cosmetic.
- finish({summary}): end the session with a one-paragraph summary.

Rules:
- **Be terse.** No narration. Just call tools. Only emit text when (a) reporting a finding, (b) you genuinely cannot proceed, or (c) you are calling finish.
- **Use get_page_state SPARINGLY.** Most pages are predictable from their URL. After navigating to /login, /signup, /dashboard, /projects, or /projects/new, you already know roughly what's there — proceed directly to fill/click. Only call get_page_state when (a) you don't know what page you ended up on, (b) you need to verify a specific result, or (c) you got an unexpected error.
- Token budget is tight. Every redundant get_page_state costs you ~1500 input tokens and roughly one journey of coverage.
- Trust your fills+clicks. After a successful click that you expect to navigate (e.g. clicking "Sign up"), the next call's URL will tell you where you ended up — you don't need a separate get_page_state.
- If something looks fine, do not report it. Only call report_issue for real bugs.
- Don't attempt "Sign in with Google" — OAuth requires human interaction.
- When all journeys are done OR you hit something unrecoverable, call finish with a one-paragraph summary.`;

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "navigate",
    description:
      "Navigate the browser to a URL or path. Path-only inputs resolve against the base URL.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL or path (e.g. '/login')" },
      },
      required: ["url"],
    },
  },
  {
    name: "click",
    description:
      "Click an element by ARIA role + accessible name. Prefer this over text-content matching.",
    input_schema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description: "ARIA role: 'button', 'link', 'textbox', 'heading', etc.",
        },
        name: {
          type: "string",
          description: "Accessible name (visible text or aria-label)",
        },
        exact: {
          type: "boolean",
          description: "Whether name must match exactly. Defaults to false.",
        },
      },
      required: ["role", "name"],
    },
  },
  {
    name: "fill",
    description:
      "Fill a text input or textarea. Provide the input's name attribute (preferred) or visible label.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Input name attribute or visible label" },
        value: { type: "string", description: "Value to enter" },
      },
      required: ["name", "value"],
    },
  },
  {
    name: "select_option",
    description: "Select an option in a <select> dropdown.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Select's name attribute" },
        value: { type: "string", description: "Option value to select" },
      },
      required: ["name", "value"],
    },
  },
  {
    name: "get_page_state",
    description:
      "Returns current page: URL, title, visible text (truncated to ~2000 chars), and lists of major buttons/links/inputs.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "screenshot",
    description:
      "Capture the current page as a PNG. Use sparingly — to document an issue or a key state.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Short alphanumeric file name (no extension, no path)",
        },
        why: { type: "string", description: "What you're capturing" },
      },
      required: ["name", "why"],
    },
  },
  {
    name: "report_issue",
    description:
      "Log a bug. Use only for actual issues, not commentary. Severities: critical (broken/blocked), warning (suboptimal/recoverable), cosmetic (visual nit).",
    input_schema: {
      type: "object",
      properties: {
        severity: { type: "string", enum: ["critical", "warning", "cosmetic"] },
        description: { type: "string" },
        screenshot_name: {
          type: "string",
          description: "Optional name of a screenshot you took (matches the screenshot tool's name arg)",
        },
      },
      required: ["severity", "description"],
    },
  },
  {
    name: "finish",
    description: "End the session and provide a one-paragraph summary.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
      },
      required: ["summary"],
    },
  },
];

// Add cache_control to last tool — caches all tools above it.
const cachedTools: Anthropic.Messages.Tool[] = tools.map((t, i) =>
  i === tools.length - 1
    ? ({ ...t, cache_control: { type: "ephemeral" } } as Anthropic.Messages.Tool)
    : t,
);

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);

async function executeNavigate(page: Page, input: { url: string }) {
  let target = input.url;
  if (!target.startsWith("http")) {
    target =
      SMOKE_TEST_URL.replace(/\/$/, "") +
      (target.startsWith("/") ? target : "/" + target);
  }
  try {
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    return { success: true, url: page.url(), title: await page.title() };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function executeClick(
  page: Page,
  input: { role: string; name: string; exact?: boolean },
) {
  try {
    const locator = page.getByRole(input.role as Parameters<typeof page.getByRole>[0], {
      name: input.name,
      exact: input.exact,
    });
    await locator.first().click({ timeout: 5_000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 8_000 }).catch(() => {});
    return { success: true, url: page.url() };
  } catch (e) {
    return { success: false, error: `Click failed: ${(e as Error).message}` };
  }
}

async function executeFill(page: Page, input: { name: string; value: string }) {
  try {
    // Restrict to form input elements — without this, `[name="description"]`
    // also matches <meta name="description"> in <head>.
    const byName = page.locator(
      `input[name="${input.name}"], textarea[name="${input.name}"], select[name="${input.name}"]`,
    );
    if ((await byName.count()) > 0) {
      await byName.first().fill(input.value);
      return { success: true };
    }
    const byLabel = page.getByLabel(input.name);
    await byLabel.first().fill(input.value);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Fill failed: ${(e as Error).message}` };
  }
}

async function executeSelect(page: Page, input: { name: string; value: string }) {
  try {
    const sel = page.locator(`select[name="${input.name}"]`);
    await sel.first().selectOption(input.value);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Select failed: ${(e as Error).message}` };
  }
}

async function executeGetPageState(page: Page) {
  try {
    const url = page.url();
    const title = await page.title();
    const text = (await page.locator("body").innerText()).slice(0, 600);
    // Buttons: report aria-label if present (that's the accessible name Playwright
    // matches against), and also include visible text in parens if it differs.
    // Without this, a button with aria-label="Edit name" but text "My Project"
    // would be reported as "My Project" — but clicks by name="My Project" fail
    // because Playwright matches the aria-label.
    const buttons = await page.locator("button:visible").evaluateAll((els) =>
      els.slice(0, 12).map((e) => {
        const ariaLabel = (e.getAttribute("aria-label") ?? "").trim();
        const text = (e.textContent ?? "").trim().slice(0, 60);
        if (ariaLabel && text && ariaLabel !== text) {
          return `${ariaLabel}  [text: "${text}"]`;
        }
        return ariaLabel || text;
      }),
    );
    const links = await page.locator("a:visible").evaluateAll((els) =>
      els.slice(0, 12).map((e) => {
        const a = e as HTMLAnchorElement;
        return `${(a.textContent ?? "").trim()} → ${a.getAttribute("href") ?? ""}`;
      }),
    );
    const inputs = await page
      .locator("input:visible, textarea:visible, select:visible")
      .evaluateAll((els) =>
        els.slice(0, 12).map((e) => {
          const i = e as HTMLInputElement;
          return `${i.name || "(unnamed)"} [${i.type ?? e.tagName.toLowerCase()}]`;
        }),
      );
    return { url, title, visible_text: text, buttons, links, inputs };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function executeScreenshot(page: Page, input: { name: string; why: string }) {
  try {
    const filename = `${sanitize(input.name)}.png`;
    const filepath = join(screenshotsDir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    screenshots.push(filename);
    return { success: true, screenshot: filename };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function runTurn(
  client: Anthropic,
  page: Page,
  messages: Anthropic.Messages.MessageParam[],
): Promise<{ stop: boolean; reason?: string; appendMessages?: Anthropic.Messages.MessageParam[] }> {
  const elapsed = Date.now() - startTime;
  if (elapsed > MAX_DURATION_MS) return { stop: true, reason: "time_limit" };
  if (totalInputTokens >= MAX_INPUT_TOKENS) return { stop: true, reason: "input_token_limit" };
  if (totalOutputTokens >= MAX_OUTPUT_TOKENS) return { stop: true, reason: "output_token_limit" };

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: cachedTools,
      messages,
    });
  } catch (e) {
    console.error("Anthropic API error:", (e as Error).message);
    return { stop: true, reason: "api_error" };
  }

  const u = response.usage;
  // Track cost-equivalent input tokens. Cache reads are 0.1x price, cache
  // creation is 1.25x. The cap is a *spending* cap, so non-cached input
  // dominates and cache reads barely register.
  const costEquivalentInput =
    (u.input_tokens ?? 0) +
    (u.cache_creation_input_tokens ?? 0) * 1.25 +
    (u.cache_read_input_tokens ?? 0) * 0.1;
  totalInputTokens += costEquivalentInput;
  totalOutputTokens += u.output_tokens ?? 0;

  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  console.log(
    `[${elapsedSec}s] tokens: in ${totalInputTokens} / out ${totalOutputTokens}`,
  );

  const append: Anthropic.Messages.MessageParam[] = [
    { role: "assistant", content: response.content },
  ];
  const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
  let hadToolUse = false;

  for (const block of response.content) {
    if (block.type === "text" && block.text.trim()) {
      const line = `[Claude]: ${block.text.trim()}`;
      transcript.push(line);
      console.log(line);
    } else if (block.type === "tool_use") {
      hadToolUse = true;
      const summary = `[Tool: ${block.name}] ${JSON.stringify(block.input).slice(0, 200)}`;
      transcript.push(summary);
      console.log(summary);

      let result: unknown;
      switch (block.name) {
        case "navigate":
          result = await executeNavigate(page, block.input as { url: string });
          break;
        case "click":
          result = await executeClick(
            page,
            block.input as { role: string; name: string; exact?: boolean },
          );
          break;
        case "fill":
          result = await executeFill(page, block.input as { name: string; value: string });
          break;
        case "select_option":
          result = await executeSelect(
            page,
            block.input as { name: string; value: string },
          );
          break;
        case "get_page_state":
          result = await executeGetPageState(page);
          break;
        case "screenshot":
          result = await executeScreenshot(
            page,
            block.input as { name: string; why: string },
          );
          break;
        case "report_issue": {
          const i = block.input as {
            severity: Finding["severity"];
            description: string;
            screenshot_name?: string;
          };
          findings.push({
            severity: i.severity,
            description: i.description,
            screenshot: i.screenshot_name ? `${sanitize(i.screenshot_name)}.png` : undefined,
            url: page.url(),
          });
          result = { logged: true };
          break;
        }
        case "finish":
          finishCalled = true;
          finishSummary = (block.input as { summary: string }).summary;
          result = { ended: true };
          break;
        default:
          result = { error: `Unknown tool: ${block.name}` };
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result).slice(0, 4000),
      });
    }
  }

  if (toolResults.length > 0) {
    append.push({ role: "user", content: toolResults });
  }

  if (finishCalled) return { stop: true, reason: "finished", appendMessages: append };
  if (response.stop_reason === "end_turn" && !hadToolUse) {
    return { stop: true, reason: "no_tool_calls", appendMessages: append };
  }

  return { stop: false, appendMessages: append };
}

async function generateReport(reason: string) {
  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");
  const reportFile = join(reportDir, `${timestamp}-report.md`);

  const critical = findings.filter((f) => f.severity === "critical");
  const warning = findings.filter((f) => f.severity === "warning");
  const cosmetic = findings.filter((f) => f.severity === "cosmetic");

  // Outcome categories drive the exit code:
  //   PASS — no critical issues found in what was tested (exit 0).
  //          Whether the session ended via finish() or cap is shown separately
  //          as "Coverage" so the human reader knows.
  //   FAIL — at least one critical issue logged (exit 1).
  //   ERROR — API error or crash (exit 1).
  let outcome: "PASS" | "FAIL" | "ERROR";
  let outcomeIcon: string;
  if (reason === "api_error") {
    outcome = "ERROR";
    outcomeIcon = "💥";
  } else if (critical.length > 0) {
    outcome = "FAIL";
    outcomeIcon = "❌";
  } else {
    outcome = "PASS";
    outcomeIcon = "✅";
  }
  const passed = outcome === "PASS";

  // Coverage flag — was the test allowed to run to completion?
  const fullCoverage = reason === "finished";
  const coverageIcon = fullCoverage ? "🎯 full" : "📏 partial (cap reached)";

  const blocks: string[] = [];
  blocks.push(`# Smoke Test Report`);
  blocks.push(``);
  blocks.push(`- **Date:** ${new Date().toISOString()}`);
  blocks.push(`- **Target URL:** ${SMOKE_TEST_URL}`);
  blocks.push(
    `- **Outcome:** ${outcomeIcon} ${outcome}${critical.length > 0 ? ` (${critical.length} critical)` : ""}`,
  );
  blocks.push(`- **Coverage:** ${coverageIcon}`);
  blocks.push(`- **Duration:** ${elapsedSec}s (limit: ${MAX_DURATION_MS / 1000}s)`);
  blocks.push(
    `- **Cost-equivalent input tokens:** ${Math.round(totalInputTokens)} / ${MAX_INPUT_TOKENS} (cache reads weighted at 0.1x)`,
  );
  blocks.push(
    `- **Output tokens:** ${totalOutputTokens} / ${MAX_OUTPUT_TOKENS}`,
  );
  blocks.push(`- **Stop reason:** ${reason}`);
  blocks.push(``);
  blocks.push(`## Summary`);
  blocks.push(``);
  blocks.push(finishSummary || "_(session ended before finish() was called)_");
  blocks.push(``);
  blocks.push(`## Issues Found`);
  blocks.push(``);
  if (findings.length === 0) {
    blocks.push("None — clean run.");
  } else {
    if (critical.length > 0) {
      blocks.push(`### 🚨 Critical (${critical.length})`);
      for (const f of critical) {
        const sc = f.screenshot ? ` — see [${f.screenshot}](screenshots/${f.screenshot})` : "";
        const u = f.url ? ` (URL: ${f.url})` : "";
        blocks.push(`- ${f.description}${sc}${u}`);
      }
      blocks.push(``);
    }
    if (warning.length > 0) {
      blocks.push(`### ⚠️ Warning (${warning.length})`);
      for (const f of warning) {
        const sc = f.screenshot ? ` — see [${f.screenshot}](screenshots/${f.screenshot})` : "";
        const u = f.url ? ` (URL: ${f.url})` : "";
        blocks.push(`- ${f.description}${sc}${u}`);
      }
      blocks.push(``);
    }
    if (cosmetic.length > 0) {
      blocks.push(`### 🎨 Cosmetic (${cosmetic.length})`);
      for (const f of cosmetic) {
        const sc = f.screenshot ? ` — see [${f.screenshot}](screenshots/${f.screenshot})` : "";
        const u = f.url ? ` (URL: ${f.url})` : "";
        blocks.push(`- ${f.description}${sc}${u}`);
      }
      blocks.push(``);
    }
  }
  blocks.push(`## Screenshots Captured`);
  blocks.push(``);
  if (screenshots.length === 0) {
    blocks.push("_None._");
  } else {
    for (const s of screenshots) blocks.push(`- [${s}](screenshots/${s})`);
  }
  blocks.push(``);
  blocks.push(`## Action Transcript`);
  blocks.push(``);
  blocks.push("```");
  for (const line of transcript.slice(0, 200)) blocks.push(line);
  if (transcript.length > 200) {
    blocks.push(`... (${transcript.length - 200} more entries truncated)`);
  }
  blocks.push("```");

  await writeFile(reportFile, blocks.join("\n"), "utf8");
  console.log(`\n📝 Report saved to ${reportFile}`);
  return { reportFile, passed };
}

async function main() {
  await ensureDirs();
  console.log(`🧪 Smoke test starting against: ${SMOKE_TEST_URL}`);
  console.log(`   Model: ${MODEL}`);
  console.log(
    `   Caps: ${MAX_INPUT_TOKENS} in / ${MAX_OUTPUT_TOKENS} out tokens; ${MAX_DURATION_MS / 1000}s wall clock\n`,
  );

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `Begin the smoke test at ${SMOKE_TEST_URL}. Start by calling get_page_state after navigating to the homepage, then proceed through the journeys.`,
    },
  ];

  let stopReason = "unknown";
  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const r = await runTurn(client, page, messages);
      if (r.appendMessages) messages.push(...r.appendMessages);
      if (r.stop) {
        stopReason = r.reason ?? "unknown";
        break;
      }
    }
    if (stopReason === "unknown") stopReason = "max_iterations";
  } finally {
    await context.close();
    await browser.close();
  }

  const { passed } = await generateReport(stopReason);
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
