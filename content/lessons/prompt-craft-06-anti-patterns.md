---
slug: prompt-craft-06-anti-patterns
title: Prompts that look smart but underperform
branch: prompt-craft
order: 6
estimated_minutes: 5
summary: A short tour of the prompt habits that feel like good practice and quietly cost you quality.
---

## Why this matters

A lot of well-meaning advice on the internet about prompting is either wrong, dated, or works in a demo and dies in real use. Knowing which "best practices" are actually anti-patterns will save you from a category of slow, disappointing answers.

## Anti-pattern 1 — Stuffing it with personas

> "You are a world-class growth marketer with 20 years of experience working at FAANG companies, also a Pulitzer-winning copywriter, also fluent in 8 languages…"

What you think it does: combines all those skills.
What it actually does: averages them into a generic voice. Pick one specific role and stop.

## Anti-pattern 2 — "Think step by step" on simple tasks

This was good advice for older models on hard reasoning tasks. Modern frontier models reason internally without being told to. Adding "think step by step" to a 2-sentence rewrite request just bloats the answer with throat-clearing.

Use it when: the task is genuinely multi-step (a math problem, a complex plan).
Skip it when: you want a clean direct answer.

## Anti-pattern 3 — Excessive politeness

"Please, if you wouldn't mind, could you possibly help me draft a short email about…"

The model isn't grading you on manners. Politeness adds tokens, doesn't change quality, and in long prompts it dilutes the actual ask. You don't need to be rude. You do need to be direct.

## Anti-pattern 4 — Asking the model to "be creative"

"Be creative" is a non-instruction. Creative how? Surreal? Witty? Uncomfortably honest? Genre-bending? The model has to guess and will land on the most generic version of "creative" — usually a slightly weirder version of normal.

Better: name the *direction* of weird. "Lean into a slightly cynical office-comedy voice." "Use the rhythm of a Twitter thread, not a press release."

## Anti-pattern 5 — Pasting your entire knowledge base

It's tempting to dump everything in for context. But:

- The model gets distracted by irrelevant parts.
- The actual question gets buried.
- Cost goes up linearly with input tokens.

Better: paste the relevant excerpt only. If you don't know what's relevant, ask the model to summarise the document first, then iterate from the summary.

## Anti-pattern 6 — Asking it to "double-check"

"Are you sure that's right?" almost always gets you "Actually, on reflection, you're right — let me revise." This is the model being sycophantic, not careful.

If accuracy matters: verify externally. Don't trust the model to police itself.

## Anti-pattern 7 — Hedging the ask

"Just a rough idea, no pressure, maybe something like…" — the model reads "low effort acceptable" and matches. Even if you're brainstorming, ask for specific, fully-formed candidates. You can always take less.

## What to do instead

The most useful prompt is usually:

- Short
- Specific
- Tells the model exactly what role/audience/format
- Uses real examples
- Doesn't apologise for asking

You'll notice it sounds like how you'd brief a sharp colleague who has 30 seconds before their next meeting.

## Try it

Take a prompt you used recently that produced a meh answer. Look for any of these 7 anti-patterns in it. Strip them out. Re-send. Notice what changes.
