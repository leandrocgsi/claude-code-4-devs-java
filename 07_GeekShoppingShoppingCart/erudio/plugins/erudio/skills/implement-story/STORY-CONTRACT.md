# STORY-CONTRACT

Shared contract of the erudio story workflow. **Every skill in this plugin reads this file first.** The story file is written in pt-BR; this contract and the skills are in English. Literal labels, headings and emojis below must be copied exactly.

## 1. The story file

One story = one file: `docs/plans/stories/<slug>.md`, relative to the workspace root (the directory that contains `docs/plans/`). The slug is kebab-case, ASCII, no accents, up to ~50 characters (for example `entrega-1-catalogo-de-produtos`). A story is the 5 km zoom on one feature: below the macroplan (`docs/plans/macroplano-geek-shopping.md`), above the code. It holds the plan, the state table, what was implemented and the review results.

## 2. Resolving the story from the argument

1. The argument is a path ending in `.md` and the file exists: use it.
2. The argument is a slug and `docs/plans/stories/<arg>.md` exists: use it.
3. Otherwise try `docs/plans/stories/*<arg>*.md`: one match, use it; several, ask which one; none, say so and suggest `/erudio:implement-story`.
4. **No argument:** list the stories in `docs/plans/stories/` and keep the **open** ones (the "Plano Implementado" row is not ✅). Exactly one: use it and say which. Several: ask with `AskUserQuestion` which one. None: say there is no open story and suggest `/erudio:implement-story`.

After resolving, always state the story path in the first line of the reply.

## 3. The stage table

The file starts with the title, a metadata line, the legend and the table. The legend is exactly:

`✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica`

The table has these 11 rows, with these exact labels, in this order. The state emoji is in the **first** column and the date in the last:

```
| Estado | Etapa | Skill | Data |
|---|---|---|---|
| ⏳ | Planejamento | /erudio:implement-story | — |
| ⏳ | Plano aprovado | /erudio:implement-story | — |
| ⏳ | Implementação do Backend | /erudio:dev-backend | — |
| ⏳ | Implementação do Frontend | /erudio:dev-frontend | — |
| ⏳ | Implementação dos testes de Backend | /erudio:dev-unit-tests | — |
| ⏳ | Implementação dos testes de Frontend | /erudio:dev-ui-tests | — |
| ⏳ | Implementação dos testes de Integração | /erudio:dev-integration-tests | — |
| ⏳ | Agente de Code Review | /erudio:agent-code-review | — |
| ⏳ | Agente de Review de Performance | /erudio:agent-perf-review | — |
| ⏳ | Agente de Review de Segurança | /erudio:agent-security-review | — |
| ⏳ | Plano Implementado | /erudio:complete-story | — |
```

| # | Row | Owner (only this skill changes it) |
|---|---|---|
| 1 | Planejamento | implement-story |
| 2 | Plano aprovado | implement-story, only after the user's explicit approval |
| 3 | Implementação do Backend | dev-backend |
| 4 | Implementação do Frontend | dev-frontend |
| 5 | Implementação dos testes de Backend | dev-unit-tests |
| 6 | Implementação dos testes de Frontend | dev-ui-tests |
| 7 | Implementação dos testes de Integração | dev-integration-tests |
| 8 | Agente de Code Review | agent-code-review |
| 9 | Agente de Review de Performance | agent-perf-review |
| 10 | Agente de Review de Segurança | agent-security-review |
| 11 | Plano Implementado | complete-story |

`/erudio:agent-tech-debt` has **no row**. The tech-debt sweep (section 9) runs once, between "Agente de Review de Segurança" and "Plano Implementado", and is recorded in "Resultados dos reviews" → `### Tech debt` and in "Alertas e débitos técnicos".

If the table does not have exactly these 11 rows in this order, stop and report the difference. Do not repair it silently.

## 4. Update rules

1. A skill edits **only its own row** (an `Edit` whose `old_string` is the whole row). It never rewrites the file. Only `implement-story` creates the file.
2. **Dates come from the system clock**, never from memory: in Bash `date '+%d/%m/%Y %H:%M'`; in PowerShell `Get-Date -Format 'dd/MM/yyyy HH:mm'`. The Data column holds the date of the last state change; `—` if it never changed.
3. **✅ only after the stage's verification passed.** The command and its result go in "Implementado". No verification, no ✅. A red test suite or a failed build is never ✅.
4. **⚪ only in planning** (`implement-story`, from the layers the user chose) **or by the user's explicit decision.** A stage skill never turns a row into ⚪ on its own.
5. **🚧 only for an external reason** (Docker unavailable, a service that is down, waiting for something outside the repo). The reason goes in one line right below the table: `> 🚧 <Etapa>: <motivo> (dd/MM/yyyy HH:mm)`. The owner removes that line when it unblocks. An open `alta` finding is not an external reason: the row stays ⏳.
6. ⏳ means pending **and** in progress. Reopening a ✅ row happens only when the user asks.
7. If the skill's own row is already ✅, say so and ask before redoing. If it is ⚪, say the story does not use this stage, do nothing else and suggest the next command (section 10).
8. Other sections are changed only by the skill that owns them (section 6).

## 5. Prerequisites per skill

A prerequisite is satisfied when its row is ✅ or ⚪.

| Skill | Rows that must be ✅ or ⚪ |
|---|---|
| implement-story | none |
| dev-backend | Plano aprovado |
| dev-frontend | Plano aprovado, Implementação do Backend |
| dev-unit-tests | Implementação do Backend |
| dev-ui-tests | Implementação do Frontend |
| dev-integration-tests | Implementação do Backend, Implementação do Frontend, testes de Backend, testes de Frontend |
| agent-code-review | Implementação do Backend, Implementação do Frontend, testes de Backend, testes de Frontend, testes de Integração |
| agent-perf-review | same as agent-code-review |
| agent-security-review | same as agent-code-review |
| agent-tech-debt | "Agente de Review de Segurança" ✅ or ⚪, and "Plano Implementado" not ✅ (outside that window the skill refuses) |
| complete-story | every row except "Plano Implementado"; the tech-debt sweep (`### Tech debt` recorded) is checked at Step 4 and may be waived only by the user |

**If a prerequisite is pending (⏳ or 🚧), do not stop and do not proceed silently: ask** with `AskUserQuestion`, in one question:

- **Run the pending stage first** (name the command and stop), or
- **Proceed anyway** (record in "Implementado", under this stage, that it ran with `<etapa>` pending).

Never proceed on a pending prerequisite without that answer, not even in auto mode. When the pending row is "Plano aprovado", say plainly that proceeding means working from a plan the user has not approved.

## 6. Sections of the story file

Fixed order and owner. Headings are pt-BR and must be copied exactly.

| Heading | Written by |
|---|---|
| `## Contexto` | implement-story |
| `## Escopo` (with `### Inclui` and `### Fora do escopo`) | implement-story |
| `## Regras de negócio` (`RN-1`, `RN-2`... each with its source) | implement-story |
| `## Backend` (plan, 5 km, no code) | implement-story |
| `## Frontend` (plan, 5 km, no code) | implement-story |
| `## Testes` (what to test per layer) | implement-story |
| `## Riscos` | implement-story |
| `## Pontos em aberto` | implement-story; any skill may append an item with its origin |
| `## Critérios de aceite` (`AC-1`, `AC-2`...) | implement-story |
| `## Implementado` with `### Backend`, `### Frontend`, `### Testes de Backend`, `### Testes de Frontend`, `### Testes de Integração` | each stage skill writes only its own subsection (files, endpoints, commands run, results, `AC`/`RN` covered, date) |
| `## Resultados dos reviews` with `### Code Review`, `### Performance`, `### Segurança` and, when `agent-tech-debt` runs, `### Tech debt` | the matching `agent-*` skill |
| `## Alertas e débitos técnicos` | any skill appends findings (section 7) |
| `## Fechamento` | complete-story |

A skeleton with all headings is in section 12.

## 7. Format of findings (code review, performance, security, tech debt)

Findings are written in pt-BR. Each one has:

```
#### <ID> · <título curto>
- Severidade: alta | média | baixa
- Veredito: precisa corrigir | tolerável
- Local: `caminho/arquivo.ext:linha`
- Evidência: <o que foi lido nessa linha, citado ou descrito de forma verificável>
- Correção sugerida: <passo concreto>
- Se nada for feito: Prós: <...> · Contras: <...>
```

IDs: `CR-n` (code review), `PF-n` (performance), `SEC-n` (security), `TD-n` (tech debt). A finding with no readable line must say so and cannot be `alta`. Security findings never print a secret's value (name the key and the place only).

Severity guide: **alta** = wrong behavior, exploitable weakness, data loss, a broken hard rule (new secret in the repo, Lombok, applied migration edited, commit made by Claude); **média** = convention or spec violation, or a cost that grows with use, without changing behavior; **baixa** = observation, small cleanup, debt already catalogued.

Verdict is the reviewer's call and is independent of severity: `precisa corrigir` or `tolerável` (acceptable now, with the pros and cons of leaving it).

Where it is written: the report in `## Resultados dos reviews` (own subsection); each finding also as a row in `## Alertas e débitos técnicos`:

`| ID | Origem | Severidade | Veredito | Local | Resumo | Status |` with status `Aberto`, `Corrigido`, `Aceito` or `Contestado`.

## 8. Alert protocol

- **alta:** stop the chain. Ask with `AskUserQuestion` (even in auto mode): fix now (the owner skill, then re-run the reviewer), accept the risk (the user's explicit choice, recorded with the date in the finding row as `Aceito`), or defer (stays `Aberto`; the stage row stays ⏳). The skill does not mark ✅ and does not suggest the next command while an `alta` is `Aberto`. A skill never accepts or contests a finding on its own.
- **média and baixa:** record and carry on. List them in the final summary of the reply, grouped by severity, with the verdict.
- A security finding that exposes a secret or allows tampering with price or total is flagged `[segurança]` at the top of the reply.
- If there are no findings, say so explicitly ("checado, sem achados"); never leave a review section empty.

## 9. Tech-debt sweep (once, between security review and closing)

The stage skills do **not** run a tech-debt pass. The sweep is the skill `agent-tech-debt`, run once per story, after "Agente de Review de Segurança" is ✅ (or ⚪) and before "Plano Implementado" is ✅. It:

1. Collects the scope: the story's files (from `## Implementado`, restricted with `git status --porcelain` and `git diff --name-only HEAD`).
2. Calls the agent `erudio:tech-debt-reviewer` with the Agent tool, passing the story path, the file list, the findings already recorded (they are `conhecido`) and the specs to compare against.
3. Records the report in `## Resultados dos reviews` → `### Tech debt` and its findings in `## Alertas e débitos técnicos` (section 7), then applies the alert protocol (section 8).
4. Suggests `Next: /erudio:complete-story` when no `alta` is `Aberto`. It updates no row.

`complete-story` checks that the sweep was recorded and asks before closing without it. Outside the window the skill refuses: before the security review it points to `/erudio:agent-security-review`; after the closing it only shows the `## Fechamento`.

## 10. Order of suggestions

`implement-story` → `dev-backend` → `dev-frontend` → `dev-unit-tests` → `dev-ui-tests` → `dev-integration-tests` → `agent-code-review` → `agent-perf-review` → `agent-security-review` → `agent-tech-debt` → `complete-story`.

After finishing, suggest the next command in this order, **skipping rows that are ⚪ or ✅**, as `Next: /erudio:<skill>`. `agent-tech-debt` has no row and is therefore never skipped by state: it is suggested right after `agent-security-review` and until its report is recorded in `### Tech debt`; once recorded, go straight to `complete-story`.

## 11. Global rules

- Never `git add`, `commit`, `push` or `checkout`. Read-only git (`status`, `diff`, `log`) is fine. Commit messages are only suggested, via `erudio-git:commit-message`.
- Never start the Spring Boot app or the Next.js dev server (`spring-boot:run`, `npm run dev`, `npm start`) or any long-running process. Ask the user. Build, compile and test commands are fine.
- No comments in generated code. No Lombok. Migrations are native SQL only and are never edited after being applied.
- Never invent a business rule. A rule that is not in the story, the specs, the macroplan or a `CLAUDE.md` goes to `## Pontos em aberto` or becomes a question.
- Follow `docs/specs/` and the `CLAUDE.md` of each project. Do not "fix" what the specs document as intentional.
- Always load the required skills **before** generating anything.

## 12. Skeleton of a new story file

```
# <Título da história>

> Slug: `<slug>` · Criada em: <dd/MM/yyyy HH:mm> · Origem: <macroplano / spec / pedido do usuário>

✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica

<tabela de 11 linhas da seção 3>

## Contexto
## Escopo
### Inclui
### Fora do escopo
## Regras de negócio
## Backend
## Frontend
## Testes
## Riscos
## Pontos em aberto
## Critérios de aceite
## Implementado
### Backend
### Frontend
### Testes de Backend
### Testes de Frontend
### Testes de Integração
## Resultados dos reviews
### Code Review
### Performance
### Segurança
## Alertas e débitos técnicos
## Fechamento
```

Empty sections written by later skills start with `_Pendente._`.
