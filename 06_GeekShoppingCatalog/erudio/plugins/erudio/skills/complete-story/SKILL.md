---
name: complete-story
description: Use this skill to close a GeekShopping story once every applicable stage is done. Triggers on "encerrar a história", "complete-story", "fechar o plano", "finalizar a feature". It checks that all applicable rows are done, maps each acceptance criterion to evidence, consolidates the open findings and debts without hiding any, asks whether to close, marks "Plano Implementado", adds the "Fechamento" section and suggests the next story from the macroplan.
argument-hint: [story slug or path]
---

# complete-story

Stage 11, the last one of the story workflow.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- Never writes or edits code, specs or migrations.
- Never closes a story with an applicable row that is not ✅ or ⚪ without the user's explicit decision.
- Never hides, summarizes away or reclassifies an open finding or debt to make the story look clean.
- Never closes without asking.
- Never runs git writes (the commit is the user's).

## Step 0 — Story and state

1. Resolve the story (contract, section 2) and validate the table (section 3).
2. Own row "Plano Implementado": **✅** → say the story is already closed and show the `## Fechamento`; do nothing else. **⚪** → say the story does not use this stage.

## Step 1 — Check the rows

List the ten rows before "Plano Implementado". Each must be ✅ or ⚪.

For every row that is ⏳ or 🚧, build a gap list: the row, its state, the reason line if it is 🚧, and **the command that closes it** (from the table: for example "Implementação dos testes de Integração: `/erudio:dev-integration-tests <slug>`"). Show the list and ask with `AskUserQuestion`: **fechar as lacunas antes** (stop here, with the commands in order of section 10) or **encerrar mesmo assim** (continue; record the gaps in the `## Fechamento`). Do not continue without the answer.

## Step 2 — Map the acceptance criteria

For each `AC-n` in `## Critérios de aceite`, find the evidence in the story and the repository and state it: the `### Implementado` entry that covers it (file, endpoint, screen), the test that checks it (class or file, from `### Testes ...`), and the verification result recorded. Mark each as **evidenciado**, **parcial** (say what is missing) or **sem evidência**. Read the files cited to confirm they exist; do not trust the record blindly. A criterion with no evidence is shown, never omitted.

## Step 3 — Consolidate findings and debts

Read `## Alertas e débitos técnicos` and `## Resultados dos reviews` and the `## Pontos em aberto`. List **everything still open**, grouped by severity (`alta`, `média`, `baixa`), with ID, origin, location, verdict and status (`Aberto`, `Aceito`, `Contestado`, `Corrigido` counted separately). Include the open points from the plan. Nothing is left out.

An **alta** that is `Aberto` stops the closing (contract, section 8): ask with `AskUserQuestion`, even in auto mode, whether to fix now (back to the owner skill), accept the risk (explicit, recorded) or leave the story open.

## Step 4 — Tech-debt sweep check

This skill does not run the sweep itself: `/erudio:agent-tech-debt` runs before it (contract, section 9). Check that `## Resultados dos reviews` has a `### Tech debt` report with its date and that its findings are rows in `## Alertas e débitos técnicos`. If it is missing, ask with `AskUserQuestion`: **rodar a varredura antes** (stop here and give `Next: /erudio:agent-tech-debt <slug>`) or **encerrar sem a varredura** (continue; record the gap in the `## Fechamento`). Do not continue without the answer. If it exists, fold its open findings into the list of Step 3 and apply the alert protocol (an `alta` `Aberto` still stops the closing).

## Step 5 — Ask whether to close

Show a short summary: rows state, criteria (evidenciado/parcial/sem evidência), open findings by severity, gaps accepted. Ask with `AskUserQuestion`: **Encerrar a história** or **Manter aberta**. Only an explicit **Encerrar** continues. Any other answer, or no answer (auto mode included), leaves the story as it is.

## Step 6 — Close

1. Fill `## Fechamento` (replace `_Pendente._`) in pt-BR with: the closing date from the system clock (contract, section 4, item 2); the criteria table (`AC` → evidência → situação); the open findings and debts consolidated by severity; the gaps accepted at Step 1, if any; the decisions the user made while closing.
2. Set "Plano Implementado" to ✅ with the real date, editing only that row.

## Step 7 — Suggest the next story

Read `docs/plans/macroplano-geek-shopping.md` and `docs/plans/stories/`. Find the first delivery of the macroplan's order that has no story (or whose story is not closed) and suggest it: `Next: /erudio:implement-story <entrega>`, with one line on why it is next and any dependency on the story just closed. If every delivery already has a closed story, say so. You may also mention that `erudio-git:commit-message` can prepare the commit message; the commit itself is the user's.

Final reply: story path, closing date, criteria summary, the open findings count by severity, and the suggested next story.
