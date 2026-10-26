---
name: agent-code-review
description: Use this skill to run the code review of a GeekShopping story. Triggers on "code review da história", "agent-code-review", "revisar o código da história contra as specs". It finds the story's files through git status/diff, delegates to the read-only erudio:code-reviewer agent, records the report in "Resultados dos reviews" and the findings in "Alertas e débitos técnicos", applies the alert protocol and updates only the row "Agente de Code Review".
argument-hint: [story slug or path]
---

# agent-code-review

Stage 8 of the story workflow. A thin skill: it prepares the scope, delegates to the agent `erudio:code-reviewer`, records the result and applies the alert protocol. It never edits code.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- Never edits code, specs or migrations; the reviewer only reads, and fixes belong to the stage skills.
- Never accepts, contests or downgrades a finding on its own.
- Never hides a finding to get a ✅.
- Never runs git writes.

## Step 0 — Story, state and prerequisites

1. Resolve the story (contract, section 2) and validate the table (section 3).
2. Own row "Agente de Code Review": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisites (section 5): the implementation and test rows ✅ or ⚪. If any is pending, ask whether to run that stage first or proceed anyway.

## Step 1 — Find the scope

1. Collect the story's files from `## Implementado` (every path listed in its subsections).
2. Run `git status --porcelain` and `git diff --name-only HEAD`, and **restrict** the result to the story's files (and to new untracked files under the paths the story touches). Never review files outside the story.
3. If the scope is empty, say so and ask the user for the paths; do not call the agent with no files.

## Step 2 — Delegate

Call the **Agent tool** with `subagent_type: erudio:code-reviewer` and a prompt that contains: the story path; the stage "Agente de Code Review"; the file list; the specs to read (`docs/specs/backend/`, `docs/specs/frontend/`, the `CLAUDE.md` files); and the instruction to answer in the report format of its definition. Do not paraphrase its checklist.

## Step 3 — Record

1. Write the full report under `## Resultados dos reviews` → `### Code Review`, replacing `_Pendente._` (or appending a dated run if the section already has a report), with the real date.
2. For every finding, append a row to `## Alertas e débitos técnicos` (`| ID | Origem | Severidade | Veredito | Local | Resumo | Status |`), origin "Code Review", status `Aberto`.
3. If the report does not follow the contract format (a finding without `arquivo:linha` or evidence, no severity or verdict), ask the agent once to correct it; if it still does not, record what you have and say so.

## Step 4 — Alert protocol

Apply the contract (section 8):

- **alta**: stop. Ask with `AskUserQuestion`, even in auto mode: **corrigir agora** (the owner stage skill, then re-run this review), **aceitar o risco** (the user's explicit choice: status `Aceito` with the date) or **adiar** (stays `Aberto`). The row is not ✅ and no next command is suggested while an `alta` is `Aberto`.
- **média** and **baixa**: record and list them in the final reply, grouped by severity, each with its verdict and its pros and cons of doing nothing.

## Step 5 — Update the row and suggest the next command

When the report is recorded, every checklist group is covered (findings or "checado, sem achados") and no `alta` is `Aberto`, set "Agente de Code Review" to ✅ with the real date, editing only that row. Final reply: story path, scope size, counts by severity, the `média`/`baixa` findings, and `Next: /erudio:<skill>` following section 10 (usually `/erudio:agent-perf-review`).
