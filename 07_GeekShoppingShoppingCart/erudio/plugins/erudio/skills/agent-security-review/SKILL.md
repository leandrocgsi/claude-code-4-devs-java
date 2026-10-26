---
name: agent-security-review
description: Use this skill to run the security review of a GeekShopping story. Triggers on "review de segurança da história", "agent-security-review", "checar validação, injeção, CORS e regras burláveis da história". It finds the story's files through git status/diff, delegates to the read-only erudio:security-reviewer agent, records the report in "Resultados dos reviews" and the findings in "Alertas e débitos técnicos", applies the alert protocol (never printing secret values) and updates only the row "Agente de Review de Segurança".
argument-hint: [story slug or path]
---

# agent-security-review

Stage 10 of the story workflow. A thin skill: it prepares the scope, delegates to the agent `erudio:security-reviewer`, records the result and applies the alert protocol. It never edits code.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- Never edits code, specs or migrations; the reviewer only reads, and fixes belong to the stage skills.
- **Never prints the value of a secret** in the story file or in the reply: only the key name and the `arquivo:linha`. If the agent returns a value, replace it with `[valor omitido]` before recording.
- Never sends traffic to a running system or runs a scanner.
- Never accepts, contests or downgrades a finding on its own.
- Never hides a finding to get a ✅.
- Never runs git writes.

## Step 0 — Story, state and prerequisites

1. Resolve the story (contract, section 2) and validate the table (section 3).
2. Own row "Agente de Review de Segurança": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisites (section 5): the implementation and test rows ✅ or ⚪. If any is pending, ask whether to run that stage first or proceed anyway.

## Step 1 — Find the scope

1. Collect the story's files from `## Implementado`.
2. Run `git status --porcelain` and `git diff --name-only HEAD`, and **restrict** the result to the story's files (and to new untracked files under the paths the story touches). Add the configuration files the story changed (`application.yml`, `pom.xml`, `next.config.ts`, `.env*` names only).
3. If the scope is empty, say so and ask the user for the paths; do not call the agent with no files.

## Step 2 — Delegate

Call the **Agent tool** with `subagent_type: erudio:security-reviewer` and a prompt that contains: the story path; the stage "Agente de Review de Segurança"; the file list; the specs to read (`docs/specs/backend/`, `docs/specs/frontend/`, the `CLAUDE.md` files); the reminder that secret values must never be printed; and the instruction to answer in the report format of its definition.

## Step 3 — Record

1. Write the full report under `## Resultados dos reviews` → `### Segurança`, replacing `_Pendente._` (or appending a dated run), with the real date.
2. For every finding, append a row to `## Alertas e débitos técnicos` (`| ID | Origem | Severidade | Veredito | Local | Resumo | Status |`), origin "Segurança", status `Aberto`.
3. If the report does not follow the contract format (a finding without `arquivo:linha`, evidence or a concrete scenario), ask the agent once to correct it; if it still does not, record what you have and say so.

## Step 4 — Alert protocol

Apply the contract (section 8):

- **alta**: stop. Ask with `AskUserQuestion`, even in auto mode: **corrigir agora** (the owner stage skill, then re-run this review), **aceitar o risco** (the user's explicit choice: status `Aceito` with the date) or **adiar** (stays `Aberto`). The row is not ✅ and no next command is suggested while an `alta` is `Aberto`. A finding that exposes a secret or allows tampering with price or total starts the reply with `[segurança]`.
- **média** and **baixa**: record and list them in the final reply, grouped by severity, each with its verdict and its pros and cons of doing nothing.

## Step 5 — Update the row and suggest the next command

When the report is recorded, every checklist group is covered and no `alta` is `Aberto`, set "Agente de Review de Segurança" to ✅ with the real date, editing only that row. Final reply: story path, scope size, counts by severity, the `média`/`baixa` findings, and `Next: /erudio:<skill>` following section 10 (usually `/erudio:agent-tech-debt`, the sweep that runs between this stage and the closing).
