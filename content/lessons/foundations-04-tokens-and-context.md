---
slug: foundations-04-tokens-and-context
title: Tokens, context, and why the model "forgets"
branch: foundations
order: 4
estimated_minutes: 5
summary: A practical mental model of context windows — what fits, what gets dropped, and how to work around the limits without overthinking it.
---

## Why this matters

You've probably had this happen: a chat going well for ten messages suddenly seems to forget what you said earlier. The model didn't forget. It ran out of room. Knowing how that room works lets you stop being surprised by it.

## What a "token" is

The model doesn't read words; it reads **tokens** — small units of text, usually around ¾ of a word. "Hello" is one token. "Hallucinate" is two ("hall" + "ucinate"). Code, URLs, and unusual punctuation chew through tokens fast.

Rough rule: **1,000 tokens ≈ 750 English words ≈ 4 paragraphs.**

## The context window

Every request to the model carries a budget — the **context window**. It includes:

1. The system prompt (instructions, persona, anything wired in by the app)
2. The full conversation history (every prior turn)
3. Any documents/code/excerpts pasted in
4. The current user message
5. Room for the model's reply

Most modern models have windows of 100,000+ tokens, which is huge. But it can still fill up: long pasted documents, many turns, big tool outputs. When it does, the app (or the model) starts dropping the oldest parts.

## What "forgetting" actually feels like

- Fact you mentioned 15 messages ago is gone.
- The model starts repeating itself or asking again.
- A long-form draft loses the structure you established.
- The voice/tone subtly drifts away from what you set up early on.

In this app, the coach trims old messages once a conversation gets long, keeping only the most recent ~40. This is normal and necessary.

## How to work with the limit

- **Anchor important context.** Re-state the key fact in your current message instead of relying on it being remembered.
- **Use Project memory.** This app's coach has a separate "what you remember" layer that survives context trimming. Pinning a fact there is durable.
- **New thread for new topic.** Don't pile a fresh problem onto a 60-message thread. Start fresh — you'll get cleaner answers.
- **Trim before you paste.** If you're sharing a long document, paste only the relevant section. The model is sharper on tighter context.

## Try it

Look at one of your existing coach threads in this Project. If it's more than ~30 turns long and feels off, start a fresh one and re-state the goal. You'll usually get a better answer in the new thread than in the tail of the old one.
