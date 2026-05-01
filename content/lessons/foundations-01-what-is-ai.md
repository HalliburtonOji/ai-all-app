---
slug: foundations-01-what-is-ai
title: What's actually in the AI box
branch: foundations
order: 1
estimated_minutes: 5
summary: A grounded mental model of what large language models actually do — and don't.
---

## Why this matters

People say "AI" the way people used to say "the internet" — as if it's one thing. It isn't. Knowing what's behind the curtain makes you faster, more critical, and harder to fool.

## The short version

A large language model (LLM) is a function that takes some text and predicts what text should come next. That's it. The illusion of conversation, helpfulness, even reasoning, all emerges from millions of next-token predictions stitched together.

It learned this by reading an enormous pile of human writing — books, code, web pages, papers. The weights inside the model don't store the source text; they store statistical patterns about how language flows.

## What this means in practice

- **It doesn't "know" things.** It produces plausible-looking text. Often that text is correct because the patterns lined up with reality, but correctness is a side effect, not a guarantee.
- **It has no live access to the world** unless someone explicitly wires it up — no internet, no your-files, no your-bank-account.
- **It can't "see" you or remember you** between sessions unless something stores the conversation.
- **It does not have feelings, intent, or self-awareness.** It generates apologies because apologies are common in training data, not because it's sorry.

## When that mental model helps you

You're about to ask "is this true?" — instead ask "what would make this likely to be wrong?" You're about to ask "why doesn't it remember?" — now you know it doesn't, by default. You're about to be impressed by something that sounds confident — now you know confidence is a stylistic feature, not a signal of accuracy.

## Try it

Ask the coach (in this Project's coach tab): *"Explain what an LLM is in 3 sentences, like you're talking to my sceptical uncle."*

Read the answer with this question in mind: which parts are concrete facts, and which parts are stylistic flourishes?
