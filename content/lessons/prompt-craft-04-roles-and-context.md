---
slug: prompt-craft-04-roles-and-context
title: Roles and context — putting the model in a useful chair
branch: prompt-craft
order: 4
estimated_minutes: 5
summary: Telling the model who it is, who you are, and what room you're standing in. The fastest way to lift answer quality after specificity.
---

## Why this matters

The same model can sound like a generic helpdesk or a sharp colleague depending on how you frame the conversation. Roles and context aren't magic — they're shortcuts to a specific bundle of patterns that already lives in the model's training data. Use the shortcut.

## The role move

Open with a sentence assigning the model a specific identity:

> You're a senior copywriter who has run a freelance practice for 8 years.
>
> You're a Lagos-based growth marketer who has launched 5 D2C brands in West Africa.
>
> You're a no-nonsense CFO reviewing a friend's startup pitch.

The role doesn't need to be real or famous. It needs to be specific enough that the model latches onto a distinct voice and set of assumptions. Generic ("you're an expert") barely helps. Specific ("you're a budget-conscious mom of two who does meal-planning every Sunday") helps a lot.

## The context move

Right after the role, give it the room you're standing in:

> The audience is small-business owners in the UK who are skeptical of AI.
>
> This is for a one-page about page on a freelance designer's portfolio site, no tagline yet.
>
> The reader is a senior dev who already knows React and is short on time.

This sets the stage. The model now knows what it's optimising for.

## The full shape

> You're a [role with specifics]. The reader is [audience with specifics]. The format is [thing].
>
> Here's what I want: [task].
>
> Constraints: [length, tone, things to avoid].

This is maybe 4 sentences. It does more than 12 sentences of vague description ever could.

## Common mistakes

- **Stacking too many roles.** "You're a marketer / designer / writer / lawyer." The model will average. Pick one.
- **Roles without context.** "You're a copywriter" without telling it who's reading is half-useful.
- **Forgetting yourself.** Telling it who *you* are matters too — it changes what tone the model picks back.

## What this is and isn't

This is **not** "jailbreaking" or making the model do something it otherwise wouldn't. It's just steering. The model is going to roleplay *something*; you might as well tell it which something. The wholesome charter still holds — don't use roles to dodge accountability or invent expertise the model doesn't have.

## Try it

Take a previous prompt where the answer was "fine but generic." Add a specific role + context block at the top. Send the same ask. Compare.
