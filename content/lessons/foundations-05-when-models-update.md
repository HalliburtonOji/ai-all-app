---
slug: foundations-05-when-models-update
title: When the model updates, what changes
branch: foundations
order: 5
estimated_minutes: 4
summary: New model versions ship every few months. What that actually changes for your work, and what to ignore.
---

## Why this matters

Model providers ship new versions on a regular cadence — small upgrades quarterly, big ones once a year. Online discourse treats every release like a revolution. Most aren't. Knowing what's *actually* changing helps you stop chasing every announcement and stay focused on the work.

## What "knowledge cutoff" means

Each model is trained on data up to a certain date — its **knowledge cutoff**. After that date, it knows nothing. If you ask it about events, products, releases, prices, or facts that emerged post-cutoff, it will guess (and sometimes confidently lie).

This app's coach has a knowledge cutoff measured in months ago. So:

- "Who won the Premier League this season?" — model probably doesn't know.
- "Best React framework as of today?" — answer reflects the cutoff date, not now.
- "What's the price of a USD credit pack on this app?" — model won't know unless the app told it.

When something is fresh, **verify externally**. Don't trust an LLM's "current best" claim.

## What "new model version" usually changes

The release notes say a lot. The day-to-day reality is usually:

- **Better at long, multi-step reasoning.** Things that took 3 prompts may now take 1.
- **Less hallucination on niche topics** — but never zero.
- **Slightly different voice and quirks.** Your old prompts may need a small tune.
- **New tool support, longer context, faster responses.** Useful but rarely transformational.
- **Fresher knowledge cutoff.** Maybe a few months newer than the previous version.

What it almost never changes: the fundamental shape of how to prompt well, the rules around hallucination, or the cost-vs-value calculus.

## What to ignore

- The breathless "this changes everything" content. It rarely does, especially for the day-to-day work most people do with AI.
- Benchmark scores. They're useful for comparing frontier models but tell you almost nothing about how it'll feel for your work.
- The pressure to switch immediately. If your current setup works, give the new model a few weeks to bake before retooling.

## What's worth checking

- Does the new model handle a job your old setup struggled with? (Try the actual job, not a benchmark.)
- Did the cost change meaningfully?
- Did anything you depend on get deprecated?

## Try it

Pick the kind of task you do most often (drafting, brainstorming, summarising, etc). Next time a new model ships in this app, do that exact task with the old and new model in two side-by-side threads. Notice the difference. Most often it's small.
