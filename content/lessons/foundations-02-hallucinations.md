---
slug: foundations-02-hallucinations
title: Why AI sometimes confidently lies
branch: foundations
order: 2
estimated_minutes: 6
summary: Hallucinations aren't a bug — they're how the system works. Here's how to catch them before they cost you.
---

## Why this matters

The model will sometimes give you an answer that's beautifully written, sounds authoritative, and is completely wrong. This is called a *hallucination*. It will not warn you. The wholesome charter of this app is built partly around making sure you don't get burned by one.

## Why it happens

The model is predicting the next plausible token. "Plausible" is judged against how language usually flows — not against reality.

Examples:

- You ask for a citation. Citations in training data follow a pattern: author, year, title, journal. So the model produces a citation that *looks* exactly like a real one. The author may not exist. The paper may not exist. It still looks real.
- You ask about a niche tool. The model has seen *similar* tools described in similar ways. It blends them. The output reads like a confident review of one specific tool, but it's actually a fictional composite.
- You ask about something that happened after the model's training cutoff. It guesses based on patterns from before. It will not tell you it's guessing.

## How to catch a hallucination

1. **Ask for sources, then verify.** If the model cites a paper, search for it. If it can't be found, the citation is fabricated.
2. **Cross-check facts that have a "right answer."** Numbers, names, dates, prices, URLs. If it matters, click and confirm.
3. **Watch for too-clean structure on a niche topic.** Real expertise is messy. If the model gives you a perfectly tidy answer about something obscure, be sceptical.
4. **Ask the same thing twice, in different sessions.** If the answers contradict, neither is reliable.
5. **Beware confident apologies.** If you challenge a wrong fact and the model immediately agrees and gives you a *different* wrong fact, you're in a loop. Stop and verify externally.

## What this means for your work

Use AI for: drafting, brainstorming, transforming things you already know, generating examples, exploring shape.

Verify before you ship: any specific fact, name, citation, statistic, code snippet for a real project, legal claim, medical claim, financial claim.

The wholesome rule: **never publish a number or a citation an LLM gave you without independently confirming it.** Disclose AI involvement when it's relevant — that's the Disclose-AI tag in this app's roadmap.

## Try it

Ask the coach: *"Cite three peer-reviewed studies on the productivity effect of LLMs at work, with author, year, and journal."*

Then try to find one of them on a real source (Google Scholar, the journal's site). Note what happens.
