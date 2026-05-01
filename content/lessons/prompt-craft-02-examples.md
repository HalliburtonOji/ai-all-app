---
slug: prompt-craft-02-examples
title: Show, don't tell — examples beat rules
branch: prompt-craft
order: 2
estimated_minutes: 5
summary: When you describe a style with adjectives, the model guesses. When you give it 2–3 examples, it pattern-matches.
---

## Why this matters

LLMs are extremely good at one thing: continuing a pattern. If you give them a pattern, they'll match it almost eerily well. If you give them only a description, they'll fall back to the most generic version of that description.

This trick — sometimes called *few-shot prompting* — is usually the fastest way to lift output quality.

## The pattern

Bad:

> Write me 3 product names. They should be modern, friendly, but a bit weird.

What you get: a list of names that are objectively all "fine" and none of which feel like *yours*.

Better:

> I'm naming a side project. Here's the vibe — names I love, for reference:
>
> - Are.na (an art research platform)
> - Tofu (an internal Microsoft tool)
> - Oxide (a server company)
>
> Notice: short, slightly weird, no obvious meaning, never a portmanteau, never ending in "ly" or "io".
>
> Now generate 8 candidate names for a tool that helps freelance editors invoice clients. Same vibe.

This works because the examples encode taste better than adjectives ever could.

## Where this is most useful

- **Voice and tone.** Paste 2–3 paragraphs of your own writing, then ask the model to draft something in that voice. Works dramatically better than "be casual but professional".
- **Format.** Paste 2 examples of the format you want — a Tweet thread, a meeting note, a JIRA ticket. Then ask for a third in the same shape.
- **Edge cases.** Show the model a couple of examples that handled tricky inputs the way you wanted. It will pattern-match the trickiness.

## Counter-intuitive bit

Even one good example beats three rules. Even bad examples (with you saying "but better than this") often produce good output, because the model now has a contrast to work against.

## Try it

In the coach for this Project, paste 2–3 examples of any kind of writing you want to imitate (your favourite tweets, three taglines you admire, two cover letters that worked). Then ask for one more in that exact style. Compare to what you get if you ask the same thing with adjectives only.
