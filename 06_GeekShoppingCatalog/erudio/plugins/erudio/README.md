# erudio

Story workflow for the GeekShopping project. A **story** is the 5 km zoom on one feature: it sits between the macroplan (`docs/plans/macroplano-geek-shopping.md`, 10 km) and the code. Each story is one pt-BR file, `docs/plans/stories/<slug>.md`, with a state table of 11 fixed rows. `/erudio:implement-story` plans it; one skill per stage implements and verifies its part and updates **only its own row**; reviewer agents read the result; `/erudio:complete-story` closes it.

The shared rules of the workflow live in `skills/implement-story/STORY-CONTRACT.md`. Every skill reads it first.

## Flow

```
implement-story ─► dev-backend ─► dev-frontend ─► dev-unit-tests ─► dev-ui-tests ─► dev-integration-tests
                                                                                          │
   complete-story ◄─ agent-security-review ◄─ agent-perf-review ◄─ agent-code-review ◄────┘

agent-tech-debt: once, between agent-security-review and complete-story
```

After finishing, each skill suggests the next command in this order, skipping rows that are ⚪ or ✅.

## The state table

Legend (first line after the title): `✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica`

| Emoji | Meaning | Who sets it |
|---|---|---|
| ✅ | Concluído | the owner skill, only after its verification passed |
| ⏳ | Pendente (also "in progress") | initial state |
| 🚧 | Bloqueado | the owner skill, only for an **external** reason, with a reason line below the table |
| ⚪ | Não se aplica | `implement-story` while planning, or the user |

The 11 rows, in order, and who owns each:

| # | Etapa | Skill |
|---|---|---|
| 1 | Planejamento | `/erudio:implement-story` |
| 2 | Plano aprovado | `/erudio:implement-story`, only after the user's explicit approval |
| 3 | Implementação do Backend | `/erudio:dev-backend` |
| 4 | Implementação do Frontend | `/erudio:dev-frontend` |
| 5 | Implementação dos testes de Backend | `/erudio:dev-unit-tests` |
| 6 | Implementação dos testes de Frontend | `/erudio:dev-ui-tests` |
| 7 | Implementação dos testes de Integração | `/erudio:dev-integration-tests` |
| 8 | Agente de Code Review | `/erudio:agent-code-review` |
| 9 | Agente de Review de Performance | `/erudio:agent-perf-review` |
| 10 | Agente de Review de Segurança | `/erudio:agent-security-review` |
| 11 | Plano Implementado | `/erudio:complete-story` |

Dates come from the system clock (`date '+%d/%m/%Y %H:%M'` or `Get-Date`). If a prerequisite row is pending, the skill asks whether to run that stage first or to proceed anyway.

## Skills

| Skill | What it does |
|---|---|
| `/erudio:implement-story [plan \| slug \| text]` | Asks the scope questions in one round, reads the macroplan, specs, `CLAUDE.md` files and existing stories, writes the 5 km plan (no code), marks unused rows ⚪, asks for explicit approval |
| `/erudio:dev-backend [story]` | Loads the erudio-spring-boot skills, then migration, entity, repository, DTOs, service, controller + `*ControllerDocs`, config; verifies with `./mvnw -q clean package -DskipTests` |
| `/erudio:dev-frontend [story]` | Loads erudio-frontend and the project's visual-identity skill, confirms the real contract in the backend, then models, services, hooks, stores, components, thin pages; verifies with `tsc`, lint and build |
| `/erudio:dev-unit-tests [story]` | Mockito service and mapper tests, one per business rule; `./mvnw test` |
| `/erudio:dev-ui-tests [story]` | Vitest + Testing Library tests for services, hooks, stores and components in their three states |
| `/erudio:dev-integration-tests [story]` | Testcontainers MySQL + REST Assured flows, error paths, filters and pagination; blocks (🚧) if Docker is unavailable |
| `/erudio:agent-code-review [story]` | Delegates to `erudio:code-reviewer` |
| `/erudio:agent-perf-review [story]` | Delegates to `erudio:perf-reviewer` |
| `/erudio:agent-security-review [story]` | Delegates to `erudio:security-reviewer` |
| `/erudio:agent-tech-debt [story]` | Delegates to `erudio:tech-debt-reviewer`; has no row in the table; runs only between the security review and `complete-story` |
| `/erudio:complete-story [story]` | Checks the rows, maps each acceptance criterion to evidence, consolidates open findings, asks, closes, suggests the next story |

With no argument, a skill uses the only open story; with several, it asks.

## Agents

| Agent | Model | Tools | Looks for |
|---|---|---|---|
| `code-reviewer` | opus | Read, Grep, Glob, Bash | adherence to the story, specs and erudio skills: layers, names, style, migrations, API contract, errors, validation, frontend architecture, visual guardrails |
| `perf-reviewer` | opus | Read, Grep, Glob, Bash | N+1 and fetch, pagination and filters, indexes, BLOB in listings, heavy queries; query keys, refetching, re-renders, bundle |
| `security-reviewer` | opus | Read, Grep, Glob, Bash | validation, injection in `@Query`, error leakage, CORS, upload, secrets (never printed), mass assignment, bypassable rules, frontend exposure |
| `tech-debt-reviewer` | sonnet | Read, Grep, Glob, Bash | duplication, coupling between layers, spec violations, TODO/FIXME, dead code, permanent hacks, swallowed exceptions, magic numbers, redundant dependencies, missing or disabled tests |

No agent edits anything; Bash is for read-only commands. None reports what is intentional: the public catalog without authentication while login is open; icons, tokens and attribution from MultiShop; immutable migrations V1 and V2; image storage still open; and the decisions documented in `docs/specs/`.

Every finding carries `arquivo:linha`, evidence, severity (`alta`, `média`, `baixa`), verdict (`precisa corrigir` or `tolerável`), a suggested fix and the pros and cons of doing nothing.

## Alerts

- **alta** stops the chain and asks the user (fix now, accept the risk, or defer), **even in auto mode**. While an `alta` is open, the stage is not ✅ and no next command is suggested.
- **média** and **baixa** are recorded in "Alertas e débitos técnicos" and listed in the final summary of the reply.
- The tech-debt sweep runs once per story, between the security review and `complete-story` (`/erudio:agent-tech-debt`); `complete-story` checks it was recorded.

## Requirements

- Claude Code with plugin support; the `erudio-spring-boot`, `erudio-frontend` and `erudio-git` plugins of this workspace enabled (the stage skills load their skills; if the Skill tool cannot, they read the `SKILL.md` files from `erudio-spring-boot-premium/` and `erudio-frontend-premium/`).
- JDK 25 and Maven wrapper for the backend; Node and npm for the app.
- Docker, for `dev-integration-tests` (Testcontainers). Without it the row becomes 🚧.
- A local MySQL for the existing `StartupTests`, which the skills never start on their own.
- The skills never run `git add`, `commit`, `push` or `checkout`, and never start `spring-boot:run` or `npm run dev` without asking.

## Install

The plugin is enabled in this project's `.claude/settings.json` (`extraKnownMarketplaces` with the directory `./erudio` and `enabledPlugins` with `erudio@erudio-marketplace`). Validate it with:

```
claude plugin validate erudio
claude plugin validate erudio/plugins/erudio
```

Then run `/reload-plugins`.
