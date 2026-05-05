---
slug: prompt-craft-07-thinking-out-loud
title: Tell the model to think out loud (when it actually helps)
branch: prompt-craft
order: 7
estimated_minutes: 4
summary: "Step by step" prompts aren't magic. They help on some tasks and hurt on others. Here's how to tell which.
try_it_actions: studio_text|"Try the 'show your work' shape"|"Walk me through your reasoning step by step before answering. Then give the final answer.\n\nQuestion:\n[paste a tricky judgment question here — e.g. should I take this freelance gig given these tradeoffs]"
---

## Why this matters

You've probably seen the trick: "Let's think step by step" prepended to a prompt. Sometimes it lifts answer quality; sometimes it slows things down for no reason. Knowing when each is true saves time and frustration.

## When "think step by step" helps

- **Multi-step reasoning.** Math, logic puzzles, anything with a chain of derivations.
- **Tradeoff calls.** "Should I do X or Y given these constraints" — the model laying out the tradeoffs first usually produces a better recommendation.
- **Debugging.** "Here's what I tried, here's what happened, what could be wrong" — having the model walk through possibilities beats a one-shot answer.
- **Drafting from messy inputs.** When your input is rambling, asking the model to first identify the key points before drafting produces sharper output.

## When it hurts (or doesn't help)

- **Simple lookup or retrieval.** "What's the capital of France" doesn't need a chain. Just give the answer.
- **Style imitation.** When you want a specific voice, the model thinking out loud first contaminates the output style.
- **Tight token budgets.** Reasoning eats tokens. On a long context, the visible reasoning competes with the answer.
- **Tasks where the answer is simple but the prompt is long.** The model may overthink obvious things.

## The shape that works

```
Walk me through your reasoning step by step before answering. Then give
the final answer in [format].

Question:
{your actual question}
```

Two key moves: ask for reasoning *first*, then specify what the final answer should look like. Otherwise you get reasoning-only or answer-only, neither of which is what you want.

## What to do with the reasoning

Read it. The reasoning is often more useful than the answer — because if the reasoning's wrong, the answer is wrong, and you can spot it. If the reasoning is sound but the answer is off, that's a different kind of bug to fix.

## Try it

Pick a real judgment call you're facing — a freelance gig, a design direction, a feature to ship or skip. Run the "show your work" shape against it. Read the reasoning critically. Was it the same path you'd have taken? Did it surface a tradeoff you'd missed?
