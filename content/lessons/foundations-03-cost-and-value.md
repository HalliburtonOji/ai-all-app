---
slug: foundations-03-cost-and-value
title: The cost of using AI well
branch: foundations
order: 3
estimated_minutes: 5
summary: What each request actually costs, and how to think about value vs spend without becoming a hoarder.
---

## Why this matters

Most beginner mistakes around AI cost are at one of two extremes — either burning $50 in tokens trying to brute-force a problem, or refusing to spend $0.05 to save an hour of your time. Both are wrong. A grounded mental model of cost helps you stop second-guessing every interaction.

## The unit you should think in

Most LLMs are priced per **token** — roughly ¾ of a word. A short message back-and-forth is maybe 200–800 tokens. A long doc + back-and-forth might be 5,000–20,000 tokens. Costs vary by model:

- A cheap model: about $0.001 per 1,000 input tokens.
- A frontier model (Claude Sonnet, GPT-4-class): about $0.003–$0.015 per 1,000 input tokens.
- Output is usually a few times more expensive than input.

So a ten-message coach conversation is on the order of cents. A long deep-dive with a frontier model might be tens of cents.

## How to think about value

Compare to:

- **Your hourly rate.** If a $0.20 query saves you 20 minutes and you bill more than $0.60/hour, you came out ahead.
- **The cost of being wrong.** A $5 LLM session that catches a mistake before you ship is cheap. A free LLM session that adds a confident error to a contract is expensive.
- **Your monthly cap.** This app has a monthly spend cap on the platform side so you can't accidentally run up a bill. BYOK (bring your own keys) gives you direct control. Either way, set a number you can lose without flinching.

## Smart defaults

- **Cheap model for routine work.** Drafting, summarising, brainstorming, anything where "good enough" is fine.
- **Frontier model for high-stakes work.** Reasoning through a thorny problem, legal-ish/medical-ish/financial-ish drafts, anything where a hallucination would be expensive.
- **Frontier with verification for shipping.** Generate, then verify externally. The hours saved on generation more than pay for the verification.

## What you avoid

- Re-running the same prompt 8 times because you don't like the answer. Iterate by *editing the prompt*, not by spinning the wheel.
- Pasting your entire codebase / knowledge base / inbox in for a one-line question. Be selective.
- Treating cost as a moral signal. It's a number. Use it well.

## Try it

Open the coach in this Project. Ask one question two ways:

1. Vague version: *"How do I grow my channel?"*
2. Specific version: *"I post once a week on YouTube about budget travel. My last 3 videos got 200, 350, and 1,100 views. What's a likely difference between the 1,100 video and the others?"*

Notice the difference in answer quality. The cost of both is roughly the same. The value gap is huge.
