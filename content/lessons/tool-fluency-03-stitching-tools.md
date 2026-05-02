---
slug: tool-fluency-03-stitching-tools
title: Stitching tools without the spaghetti
branch: tool-fluency
order: 3
estimated_minutes: 5
summary: Useful AI workflows are usually 2–3 tools doing one thing each, in a sequence you actually run. Here's how to build one that lasts.
---

## Why this matters

The marketing for AI tooling pretends each tool is a complete solution. In practice, the useful pattern is almost always a chain: capture → process → produce. Knowing the chain you actually run beats chasing one all-in-one.

## A working chain looks like this

The chains that survive past week one tend to share three properties:

1. **Each tool does one thing well.** No "AI-powered everything" tool. The best Studio image tool is one that takes a prompt and gives an image, not one that also organises your fridge.
2. **The handoff between tools is clean.** A copy-paste, a download-upload, an export. If the handoff requires four steps, the chain dies.
3. **The chain is short.** Two or three steps. Five is fragile. Seven is a doomed Rube Goldberg machine.

## Three real examples

### Example 1 — Weekly content for a creator

1. Voice-memo your raw idea on a walk.
2. Paste the transcript into the coach with: "Turn this into a tweet thread in my voice. Here are 3 of my old threads as reference." Get a draft.
3. Edit + post.

Three tools (voice memo app, the coach, your social tool). Twenty minutes flat. Repeatable.

### Example 2 — Freelance pitch

1. Save the job posting as text in your notes app.
2. Drop it into the coach with your standard "draft pitch" prompt and your portfolio bullet points.
3. Edit, add personalisation, send.

### Example 3 — Code helper for a small feature

1. Write a 4-line plan in a comment in your editor.
2. Use the coach (or a code helper) to scaffold the function.
3. Read the code line by line, fix what's off, run the tests.

## What kills a chain

- A tool that breaks every few weeks (silent API changes, login session loops, etc).
- A tool you have to *think* about using (e.g. "Wait, do I need to log in to that thing?").
- Pricing that's just barely worth it — you'll resent it and stop opening it.
- A handoff that involves a CSV that the next tool can't quite parse without massaging.

## How to build one

- Start from the **outcome**, not the tool. "I need to ship one tweet a week" → what's the path?
- Pick one tool per step. Resist combining.
- Run the chain manually 3 times before optimising. You'll discover the real bottleneck (usually the input, not the AI).
- Write the chain down somewhere you'll actually find it. The coach itself is fine — pin it as a project memory.

## Try it

Pick one weekly outcome you want. Sketch the 2–3 step chain on paper. Run it manually this week. Notice where it breaks — that's the place to invest, not before.
