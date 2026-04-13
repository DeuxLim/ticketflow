---
name: ticketing-self-improvement
description: Use when capturing repeated mistakes, user corrections, failed commands, missing repo knowledge, workflow gaps, or proposed updates to Ticketing project agent instructions and skills.
---

# Ticketing Self Improvement

Use this skill to improve project guidance without letting the agent silently rewrite its own rules.

## Safe Loop

1. Capture the learning in `.agents/learnings/`.
2. Classify it as an error, reusable learning, or skill idea.
3. Propose the smallest durable update.
4. Update `AGENTS.md` or a `ticketing-*` skill only when the user asks to proceed or the current task explicitly includes maintaining agent instructions.
5. Verify by reading the changed guidance and checking `git status`.

## Learning Files

- `.agents/learnings/ERRORS.md`: command failures, wrong assumptions, broken workflows, and the corrected fix.
- `.agents/learnings/LEARNINGS.md`: durable project facts that are not yet important enough for `AGENTS.md` or a skill.
- `.agents/learnings/SKILL_IDEAS.md`: candidate new skills or updates to existing `ticketing-*` skills.

## Promotion Rules

- Promote to `AGENTS.md` when the rule is global, short, and applies to most future tasks.
- Promote to an existing `ticketing-*` skill when the rule is domain-specific.
- Create a new skill only when the workflow is repeated, high-risk, or too detailed for `AGENTS.md`.
- Keep a note in `.agents/learnings/` when the fact is useful but not yet stable.

## Guardrails

- Do not auto-edit instructions just because a command failed once.
- Do not add personal preferences unless the user confirms them.
- Do not store secrets, tokens, credentials, private customer data, or copied `.env` values.
- Do not make hooks that auto-edit skills or `AGENTS.md`.
- Keep additions concise; remove stale learning notes after promoting them.

## Entry Template

Use this shape when adding a learning:

```md
## YYYY-MM-DD - Short Title

- Trigger: What happened.
- Cause: Why it happened.
- Action: What to do next time.
- Promote if: When this should become an `AGENTS.md` rule or skill update.
```
