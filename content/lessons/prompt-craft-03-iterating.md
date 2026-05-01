---
slug: prompt-craft-03-iterating
title: Iterate, don't restart
branch: prompt-craft
order: 3
estimated_minutes: 4
summary: The "regenerate" button is a trap. Editing your prompt and continuing the thread will get you somewhere; spinning the wheel won't.
---

## Why this matters

When the first answer isn't right, most people either (a) hit "regenerate" hoping for a better roll of the dice, or (b) start a new chat with a tweaked prompt. Both waste time. Iterating *inside* the existing thread, with the model already loaded with context, is almost always faster.

## The iteration moves

When the answer is *almost right*:

> "This is close — make it shorter and remove the second paragraph."

When the answer misses the point:

> "I don't think you understood. The audience is X, not Y. Try again."

When you want to compare versions:

> "Now give me 3 alternative versions of that, each leaning into a different angle: more playful, more authoritative, more vulnerable."

When you don't know why it's off:

> "I don't love this answer but I can't say why. Ask me 3 questions that would help you make it better."

This last one is underrated — the model is often better at *interrogating* than at guessing.

## When to actually start over

Some signals that iteration won't save the thread:

- The model is stuck on a wrong premise it keeps re-asserting.
- The conversation has grown so long that it's forgotten the original task.
- You realise the original prompt was missing something fundamental — better to fix prompt 1 than band-aid prompt 7.

When you do start over, take what you learned from the bad thread and bake it into prompt 1. The next attempt will be much better.

## What to avoid

- **Hitting regenerate 6 times.** If 2 attempts didn't fix it, attempt 6 won't either.
- **Arguing with the model about its mistakes.** Just give it the correct information and ask for a redo.
- **Saying "no, that's wrong" without saying *what* is wrong.** The model can't read your mind better than the second time.

## Try it

Take a draft the coach gave you in this Project that wasn't quite right. Use the iteration moves above to refine it in 2–3 turns. Notice how much information the model now has about your taste — and how that pays off in later turns.
