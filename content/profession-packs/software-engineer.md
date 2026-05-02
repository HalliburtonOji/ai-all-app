---
slug: software-engineer
title: Software Engineer
summary: Backend, frontend, full-stack, mobile, infra. The job AI's been pushed at hardest, with the most exaggerated takes on both sides.
order: 4
---

## Where AI is genuinely useful in this job

- **Boilerplate.** Form scaffolding, CRUD endpoints, test setup, migration files, type definitions, mock data. The mechanical middle of any feature.
- **Translation between languages or frameworks.** "Convert this Python script to Go." "Show me the React hook equivalent of this Vue composable." Solid for known idioms, sketchy for novel ones.
- **Debugging on familiar errors.** Paste the stack trace + relevant snippet. Often gets you the right answer faster than searching.
- **Doc and comment writing.** AI is competent at "what does this code do" — the part most engineers hate writing.
- **Code review on request.** "Critique this PR for race conditions / accessibility / security holes" gives a useful second pair of eyes, especially for things you're not the strongest at.

## Where AI is not the right tool

- **System design from a vague brief.** "Design us a multi-region chat system" — the model will give you a generic textbook answer that misses your real constraints.
- **Anything involving your private codebase's idioms.** Without seeing how your team actually does things, AI's suggestions drift toward generic patterns.
- **Production debugging when seconds matter.** AI is great at "why does this code do that?" — not at "why did this specific incident happen at 3am for users on mobile Safari in São Paulo?"
- **Trusting code you don't understand.** Shipping code from a model you can't explain is how you end up paged at 3am defending a decision you didn't make.

## Three indispensable moves

1. **Read more code than you write.** AI will draft fast; that just shifts the limit to "can you read fast and judge correctly." The engineers who pull ahead are the ones who can read 200 lines, see the bug, and explain why. Practice.
2. **Become the person who scopes.** AI writes code from a spec; it doesn't write the spec. The seniority lever is "I can take this fuzzy ask and turn it into a 4-step plan with tradeoffs." That skill is now more valuable, not less.
3. **Pick a domain.** When AI can write generic code, owning a specific domain (databases, security, ML, payments, accessibility, dev tools) is what makes you irreplaceable. Pick one. Get deep.

## Smart defaults

- Use the coach for "explain this" / "rubber-duck this" / "what am I missing" — high leverage, low risk.
- Use Studio text drafter for commit messages, PR descriptions, README sections — fast, mostly fine, lightly edited.
- Don't paste internal credentials, customer data, or private code into a public model. Run a self-hosted or BYOK setup if your work touches sensitive things.

## What to avoid

- AI-only PRs in a real codebase without reading the diff yourself. Ever.
- Letting AI's first answer be the production answer for anything load-bearing.
- "AI proof of concept" that's actually shipped to users. Either build it properly or don't ship it.
