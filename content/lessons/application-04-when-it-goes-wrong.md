---
slug: application-04-when-it-goes-wrong
title: When it goes wrong — the recovery playbook
branch: application
order: 4
estimated_minutes: 5
summary: AI-assisted work fails sometimes. Here's how to spot it early, recover gracefully, and turn the failure into a useful lesson instead of an embarrassment.
---

## Why this matters

Every regular AI user has a war story. Hallucinated stat that made it into a published article. Code that worked in dev but blew up in prod. An email that landed wrong because the AI's "warm" tone was nothing like yours. These don't have to be career-defining; they have to be caught.

## The failure modes you'll encounter

### Hallucination that snuck through

You asked for something with citations, names, numbers, or links. The model produced confident-looking output. You shipped it. The data was made up.

**Recovery:**
- If it hasn't shipped yet — verify every name, number, link, and citation against a real source. Anything unverifiable comes out.
- If it has shipped — issue a correction *as soon as you find it*. Don't wait. The half-life of trust on a confident-but-wrong claim is short. A fast correction earns more credit than the original error cost.
- Going forward — never let a confident specific make it past your edit pass without external verification.

### Tonal mismatch

The model wrote in a voice that sounded fine to you in the moment but landed wrong with the reader. The email feels too casual or too stiff. The post feels generic. The pitch sounds like it could've been written for anyone.

**Recovery:**
- Apologise plainly if the recipient flagged it. Don't blame the AI; the work has your name on it.
- Going forward — paste 3 examples of your real voice into your prompt template. Let the model pattern-match what you actually sound like.

### "Confidently wrong" suggestions

You asked for advice. The model gave a clean, confident answer. You acted on it. The advice was wrong for your specific situation in a way the model couldn't have known.

**Recovery:**
- Take the loss. Don't argue retroactively.
- Going forward — when stakes are real, ask the model to "give me the trade-offs, not a recommendation." The model is much better at mapping the chessboard than at picking moves.

### Output that's just bad

You asked. It answered. The answer is mediocre. You don't have a better one. Tempted to ship it anyway because deadline.

**Recovery:**
- Ship a shorter, simpler version of what you have, in your own words. Length is not value. A clean 80-word email beats a 250-word AI-drafted one nobody will read.
- Or — push the deadline by a few hours. Mediocre AI output reaches your reader. They notice.

## The wholesome rule

Mistakes happen. The wholesome charter of this app says: **post about your failures**. The Failure Forum is in the app for a reason. Other users learn from real stories, including yours. Failure forums make a community better in a way wins feeds don't.

## What to avoid

- **Defending AI output instead of fixing the work.** "Well, the model said…" is never the right framing. The work is yours.
- **Hiding the failure.** It almost always surfaces eventually, and it's worse second-hand.
- **Letting one failure scare you off.** One shipped hallucination doesn't mean "AI is broken" — it means "your verification step needs work." Iterate.

## Try it

Write down (in your notes app, or in this app's Failure Forum) one AI-assisted thing that didn't go the way you wanted recently. What would you do differently next time? That single sentence is more valuable than a week of theory.
