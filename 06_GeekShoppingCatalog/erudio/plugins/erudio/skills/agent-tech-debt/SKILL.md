---
name: agent-tech-debt
description: Use this skill only between "Agente de Review de Segurança" and "Plano Implementado" to sweep a finished GeekShopping story for technical debt and anti-practices, as the last check before the story is closed. Triggers on "débitos técnicos", "agent-tech-debt", "varrer antipráticas", "tem dívida técnica nisso". It finds the story's files through git status/diff, delegates to the read-only erudio:tech-debt-reviewer agent, records the report in "Resultados dos reviews" and the findings in "Alertas e débitos técnicos" and applies the alert protocol. It has no row in the story table and changes none. It refuses to run before the security review is done or after the story is closed.
argument-hint: [story slug | story path]
---

# agent-tech-debt

The tech-debt sweep of the story workflow. It runs **once, between two stages**: after "Agente de Review de Segurança" is ✅ (or ⚪) and before "Plano Implementado" is ✅. It is not run at the end of the other stages and it is not a general-purpose scan. A thin skill: it prepares the scope, delegates to the agent `erudio:tech-debt-reviewer`, records the result and applies the alert protocol. It never edits code.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- **Never changes any row of the stage table.** This skill has none.
- Never runs outside its window (Step 0).
- Never edits code, specs or migrations.
- Never accepts, contests or downgrades a finding on its own.
- Never hides a finding.
- Never runs git writes.

## Step 0 — Story and window

1. Resolve the story (contract, section 2) and validate the table (section 3). The argument is a story; a file or folder path is not accepted.
2. Check the window:
   - "Plano Implementado" is **✅** → the story is closed: say so, do nothing else, and point to its `## Fechamento`.
   - "Agente de Review de Segurança" is **⏳** or **🚧** → outside the window: do not run; say that the sweep comes after `/erudio:agent-security-review` and give that command.
   - "Agente de Review de Segurança" **✅** or **⚪** and "Plano Implementado" not ✅ → inside the window: continue.
3. Other rows still pending do not matter here; the earlier checks are the job of the stage skills and of `/erudio:complete-story`.

## Step 1 — Find the scope

- The paths listed in `## Implementado`, restricted with `git status --porcelain` and `git diff --name-only HEAD` (plus new untracked files under those paths). Never go outside the story's files.
- If the scope is empty, say so and ask for the paths; do not call the agent with no files.

## Step 2 — Delegate

Call the **Agent tool** with `subagent_type: erudio:tech-debt-reviewer` and a prompt that contains: the story path; "final sweep before closing the story"; the file list; the findings already recorded in `## Alertas e débitos técnicos` (so it marks them as `conhecido` and does not repeat them); the specs to compare against (`docs/specs/backend/`, `docs/specs/frontend/`, the `CLAUDE.md` files); and the instruction to answer in the report format of its definition.

## Step 3 — Record

1. Write the report under `## Resultados dos reviews` → `### Tech debt` (create the subsection after `### Segurança` if it does not exist), with the real date.
2. For every finding, append a row to `## Alertas e débitos técnicos` (`| ID | Origem | Severidade | Veredito | Local | Resumo | Status |`), origin "Tech debt", status `Aberto`, with the class (novo/conhecido) in the summary. IDs continue the last `TD-n` of the story.
3. If the report does not follow the contract format, ask the agent once to correct it.

## Step 4 — Alert protocol

Apply the contract (section 8):

- **alta**: stop. Ask with `AskUserQuestion`, even in auto mode: **corrigir agora**, **aceitar o risco** (the user's explicit choice: status `Aceito` with the date) or **adiar** (stays `Aberto`). No next command is suggested while an `alta` is `Aberto`.
- **média** and **baixa**: record and list them in the final reply, grouped by severity, each with its verdict and its pros and cons of doing nothing.

## Step 5 — Reply

Report the scope, counts by severity and by class (novo, conhecido), the findings below `alta` with their verdicts, and where the report was recorded. There is no row to update. When no `alta` is `Aberto`, finish with `Next: /erudio:complete-story <slug>`.
