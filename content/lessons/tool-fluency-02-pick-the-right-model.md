---
slug: tool-fluency-02-pick-the-right-model
title: Pick the right model for the task
branch: tool-fluency
order: 2
estimated_minutes: 5
summary: Frontier models cost more for a reason; cheap models are great for a reason. A working mental model of which to reach for.
---

## Why this matters

Every model labelled "AI" is not equal. Reaching for the most expensive model for every task wastes money. Reaching for the cheapest for everything wastes your time when the answer is wrong. There's a sensible middle.

## A practical taxonomy

Three rough tiers, regardless of vendor:

- **Cheap / fast**: Haiku (Anthropic), GPT-4o-mini (OpenAI), Gemini Flash, Mistral Small. Pennies per long conversation. Good for: drafting, summarising, transforming, simple Q&A, anything where being slightly wrong has low cost.
- **Frontier / mid**: Sonnet 4.x (Anthropic), GPT-4.1 / GPT-4o (OpenAI), Gemini Pro. A few cents per long conversation. Good for: anything you'd want a sharp colleague to do — reasoning, creative writing of substance, code with real stakes, long documents.
- **Frontier / large**: Opus 4.x (Anthropic), GPT-5-class (when they ship). Tens of cents per heavy run. Good for: hard reasoning, writing where craft matters, complex multi-step problems, anything where iteration cost would dwarf the model cost.

Rough cost ratios: Sonnet ≈ 5–10× Haiku; Opus ≈ 5× Sonnet. The capability gap is meaningful but not 50× — a smart prompt with Haiku often beats a lazy one with Opus.

## When to reach for cheap

- "Rephrase this paragraph with a friendlier tone."
- "List 10 candidate names for X."
- "Summarise this email thread."
- "Find the typos in this draft."
- Any task you'd let an intern do.

## When to reach for frontier

- "Help me think through this decision."
- "Write the opening 500 words of this piece, in my voice (here are 3 examples)."
- "Review this contract clause for risks."
- "Why does this code crash under load?"
- "Plan the rollout of this feature."

## When to reach for the largest model

Honestly: rarely. Real signals:

- Multi-step reasoning where one wrong step makes the whole answer useless (legal-ish, financial, complex math).
- Writing for an audience that will scrutinise every word.
- Code where correctness is load-bearing and the spec is fuzzy.

If you're tempted to use it for chat, you probably don't need to.

## Switching cost

Each model has its own quirks — voice, pacing, refusal patterns, output formatting tendencies. Bouncing between them mid-thread is a tax you pay. Pick a primary, stay with it long enough to learn its tells, only switch when a specific task genuinely benefits.

## Try it

Pick a task you did with your default model this week. Try the same task with one tier cheaper. If the answer's good enough, that's your new default for that kind of task. Repeat across task types.
