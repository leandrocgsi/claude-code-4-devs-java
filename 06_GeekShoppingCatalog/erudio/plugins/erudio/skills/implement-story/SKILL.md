---
name: implement-story
description: Use this skill when the user wants to plan or start implementing a feature of GeekShopping, asks for a story plan, "plano da história", "implementar a próxima entrega", "implement-story", or hands over a plan or spec to turn into work. It asks scope questions in one round, reads the macroplan, specs and CLAUDE.md files, and writes the story plan (5 km zoom, no code) to docs/plans/stories/<slug>.md in pt-BR, with the 11-row stage table. It never writes code and never approves the plan by itself.
argument-hint: [plan file | slug | feature description]
---

# implement-story

Entry point of the erudio story workflow. It turns a feature into a story plan at the **5 km zoom**: more detailed than the macroplan, with no code. The other stages are separate skills that update their own row of the story table.

Read [`STORY-CONTRACT.md`](STORY-CONTRACT.md) first. It defines the story file, the 11 rows, the update rules, the sections, the findings format, the alert protocol and the tech-debt sweep. Everything below assumes it.

## What this skill never does

- Never writes or edits code, specs, migrations or settings.
- Never invents a business rule. A rule that is not in the macroplan, the specs, a `CLAUDE.md` or the user's answers goes to `## Pontos em aberto`.
- Never approves the plan by itself, not even in auto mode.
- Never marks a row other than "Planejamento" and "Plano aprovado".
- Never overwrites an existing story file.

## Step 0 — Ask everything in one round

Resolve the input first:

- A path to a plan or spec: read it and use it as the source of the feature.
- A slug or path of an **existing story**: do not plan again. If "Plano aprovado" is ⏳, go to Step 4 and ask for approval; otherwise report its state and suggest the next command (contract, section 10).
- Free text: that is the feature description.
- No argument: ask what to implement (the question below covers it).

Then ask **all questions in a single `AskUserQuestion` call** (up to four questions), each with a recommended default derived from the macroplan and the specs. If the input already answers a question, skip that question.

1. **Which feature and what objective?** Options: the next deliveries of the macroplan that have no story yet (read `docs/plans/macroplano-geek-shopping.md` and `docs/plans/stories/`), plus "other" for free text. Ask for a short title.
2. **Which layers are affected?** Backend, frontend, or both. This decides the ⚪ rows: no backend: rows "Implementação do Backend" and "Implementação dos testes de Backend"; no frontend: "Implementação do Frontend" and "Implementação dos testes de Frontend"; a feature that does not cross both layers: "Implementação dos testes de Integração".
3. **Business rules and acceptance criteria.** Present the rules and criteria you derived from the specs as a proposal and ask the user to confirm or edit. Include the open points of the specs that the feature touches (for example 201 versus 200 on create, `ConflictException`, the checkout validate endpoint, image storage, login) and ask for a decision on each, or let the user leave it open.
4. **What stays out?** Items that are tempting but not part of this story. Offer the candidates found in the specs.

If the answers leave an essential gap, ask one short follow-up round; do not start writing with a gap.

## Step 1 — Read the context

Read, in this order:

1. `docs/plans/macroplano-geek-shopping.md`.
2. `docs/specs/backend/` and `docs/specs/frontend/`: the READMEs and the files about the layers and modules involved (contract, modules, data model, alignment with the current code).
3. `CLAUDE.md` at the workspace root, `geek-shopping-api/CLAUDE.md` and `geek-shopping-app/CLAUDE.md`.
4. Every story already in `docs/plans/stories/` (dependencies, overlap, naming).

Use what you read to propose the answers in Step 0 when the input is thin; if you need the context to build the questions, read before asking.

## Step 2 — Write the plan (5 km, no code)

Create `docs/plans/stories/<slug>.md` with the skeleton from the contract (section 12), in pt-BR. Never overwrite: if the file exists, ask whether to resume it or create another slug.

Fill the sections:

- **Contexto**: why the feature exists, where it sits in the macroplan, what it depends on.
- **Escopo**: `### Inclui` and `### Fora do escopo`, from the answers.
- **Regras de negócio**: `RN-n`, each with its source (spec file and section, macroplan, or "decisão do usuário em <data>").
- **Backend**: an ordered list of artifacts by name and purpose, with no code: migrations (planned number and what they create), entities, repositories, DTOs and constraints, services and their rules, controllers and endpoints (verbs and paths from the contract), exceptions, configuration. Mention the spec items from `07-alinhamento-do-codigo-atual.md` that this feature will touch.
- **Frontend**: routes, feature components, hooks, services and models, state (Query versus Zustand), design-system gaps, the three states of every screen (carregando, vazio, erro).
- **Testes**: what is covered at each level (unit, UI, integration), by `RN` and `AC`.
- **Riscos**.
- **Pontos em aberto**: every rule or detail the sources do not answer. Never fill a gap with a guess.
- **Critérios de aceite**: `AC-n`, testable, each tied to the `RN` it checks.

Leave `## Implementado`, `## Resultados dos reviews`, `## Alertas e débitos técnicos` and `## Fechamento` with `_Pendente._` under their headings.

Write the table with all 11 rows. Set **⚪** on the rows the story does not use (from the answers in Step 0) and put the real date in them. Every other row is ⏳ with `—`, except "Planejamento", which becomes ✅ only after Step 3.

## Step 3 — Verify the plan

Check, and fix before going on:

- 11 rows, exact labels, exact order; the legend is exact; the state emoji is in the first column.
- All headings of the contract are present, in order.
- No placeholder left in the sections you own (`TODO`, `<...>`, `{{...}}`).
- `AC-n` and `RN-n` numbered; every `RN` has a source; every `AC` is testable.
- The ⚪ rows match the layers the user chose.
- The Backend and Frontend sections respect the specs (names, paths, status codes, direction of dependency) and contain no code.

When it passes, set "Planejamento" to ✅ with the real date (contract, section 4). If it does not pass, leave ⏳ and say what is missing.

## Step 4 — Ask for approval

Show a short summary: title, layers, number of rules and criteria, open points, the ⚪ rows, and the path of the file. Then ask with `AskUserQuestion`: **Aprovar** · **Ajustar** · **Decidir depois**.

- Only an explicit **Aprovar** sets "Plano aprovado" to ✅ with the real date. Say that the user approved.
- **Ajustar**: collect the changes, edit the story sections you own, re-verify (Step 3) and ask again.
- **Decidir depois**, or any answer that is not an explicit approval, or no answer at all (auto mode included): leave "Plano aprovado" as ⏳ and say how to approve later (`/erudio:implement-story <slug>`).

## Step 5 — Reply and next command

The reply states the story path, the state of the table, the open points, any `média`/`baixa` finding, and the next command (contract, section 10): usually `Next: /erudio:dev-backend <slug>`, or `/erudio:dev-frontend <slug>` when the backend row is ⚪. If the plan is not approved yet, the next step is the approval, not a stage skill.
