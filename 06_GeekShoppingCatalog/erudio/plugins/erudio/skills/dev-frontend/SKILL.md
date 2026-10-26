---
name: dev-frontend
description: Use this skill to implement the frontend stage of a GeekShopping story in geek-shopping-app (Next.js App Router, TypeScript, TanStack Query, Zustand), after the backend stage. Triggers on "implementar o frontend", "dev-frontend", "codar as telas da história", "integrar o front com a API". Loads erudio-frontend and the project's visual-identity skill, follows the story's Frontend section and docs/specs/frontend, confirms the real API contract by reading the backend, and updates only the row "Implementação do Frontend". It does not write tests, does not touch the backend and never starts the dev server without asking.
argument-hint: [story slug or path]
---

# dev-frontend

Stage 4 of the story workflow: the Next.js code of the story.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- Never writes tests (that is `/erudio:dev-ui-tests`).
- Never edits anything under `geek-shopping-api/` (it only reads the controller and the DTOs).
- Never starts `npm run dev`, `npm start` or any server without asking the user first.
- Never invents a business rule, an endpoint or a field: the real contract comes from reading the backend and the specs.
- Never adds another icon library, a new color or token outside `styles/tokens`, or a hand-made dashed title.
- Never removes the MultiShop attribution from the footer.
- Never runs git writes.

## Step 0 — Story, state and prerequisites

1. Resolve the story from the argument (contract, section 2) and validate the table (section 3).
2. Own row "Implementação do Frontend": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisites (section 5): "Plano aprovado" and "Implementação do Backend" must be ✅ or ⚪. If one is pending, ask whether to run that stage first or proceed anyway.

## Step 1 — Load before coding

**Nothing is generated before this step is done.**

1. With the **Skill tool**, load `erudio-frontend:scaffold`, `erudio-frontend:visual-identity` and the project skill `geek-shopping-app-visual-identity`. If the Skill tool cannot load the first two from another plugin, read `erudio-frontend-premium/plugins/erudio-frontend/skills/<name>/SKILL.md`; the project skill is at `geek-shopping-app/.claude/skills/geek-shopping-app-visual-identity/SKILL.md`.
2. Read the story: `## Frontend`, `## Regras de negócio`, `## Critérios de aceite`, `## Pontos em aberto`.
3. Read `docs/specs/frontend/`: the README, `02-arquitetura-e-convencoes.md`, `03-dados-e-contrato-com-a-api.md`, `04-ui-estado-e-design-system.md`, `05-telas-e-modulos.md` and `07-alinhamento-do-app-atual.md`.
4. Read `geek-shopping-app/CLAUDE.md`.
5. **Confirm the real contract.** Read (read-only) the controller, the `*ControllerDocs` and the DTOs of the backend that the story uses: `geek-shopping-api/src/main/java/br/com/erudio/controllers/`, `controllers/docs/` and `data/dto/`. Compare routes, verbs, parameters, status codes and JSON field names with `docs/specs/backend/04-contrato-da-api.md` and the story. Where the code and the spec differ, the **code that exists wins for what is implemented**, and the difference is recorded in `## Pontos em aberto`; if the backend does not implement something the story needs, stop and ask.
6. **Alignment check.** If the area still diverges from `07-alinhamento-do-app-atual.md`, ask with `AskUserQuestion`: **align now** or **leave as is** (record it in `## Pontos em aberto`).
7. For any screen that exists in `MultiShop/`, read the matching HTML before changing its layout (the app is a literal port; do not rely on memory).

## Step 2 — Implement, in this order

Under `geek-shopping-app/`, as the loaded skills, the specs and the `CLAUDE.md` say.

1. **Models** (`app/core/models/`): types of the real contract. Never name a non-route file `page.ts(x)`.
2. **Service** (`app/core/api/`): one file per resource; the **HAL adapter** (`_embedded`, `page`, `_links`, with and without `_embedded` on empty pages); `ApiError` normalization of `ExceptionResponse` and `ProblemDetail` (with `errors{}`); the `Location` header on creation when the contract returns it.
3. **Hooks** (`hooks/use<Thing>/`): TanStack Query wrappers with query keys that include the filters; page reset when a filter changes; mutations invalidate the right keys.
4. **Stores** (`app/store/modules/<scope>/`): Zustand, one file per store, **read only through facade hooks with selectors**. Server data stays in Query, not in Zustand.
5. **Components** (`components/feature/<Name>/`: `.tsx`, `.module.css`, `index.ts`; generic pieces in `components/ui`): tokens only (`--background` for cards, `--surface` for the page), **radius 0**, icons only from `react-icons/fa`, `SectionTitle` for dashed titles, `'use client'` where there is state or handlers. **Every screen that loads data implements the three states: carregando, vazio, erro.**
6. **Pages** (`app/(dashboard)/<route>/page.tsx`): thin, only render a feature component.

Respect the dependency direction: `page` → `feature` → `ui` / `hooks` → `core` / `store`. Identifiers in English, texts in English, no comments, no authentication code. Update `geek-shopping-app/.claude/skills/geek-shopping-app-visual-identity/SKILL.md` if the visual identity or the component inventory changed.

## Step 3 — Validate

From `geek-shopping-app/`, in this order, all must pass:

```
npx tsc --noEmit
npm run lint
npm run build
```

Fix failures at the cause. Never mark ✅ with a failing command. Do **not** start the dev server: ask the user to look at the screens and record "conferência visual: pendente" or the user's answer.

## Step 4 — Record in "Implementado"

Under `## Implementado` → `### Frontend`, replace `_Pendente._` with: files created and changed; routes and screens; endpoints consumed (verb, path); the three commands and their results; the visual check status; the `RN`/`AC` covered; the alignment items done or deferred; the differences found between spec and backend code; and, if it ran with a pending prerequisite, that fact. Add the real date.

## Step 5 — Update the row and suggest the next command

If the three commands passed and there is no open `alta` finding, set "Implementação do Frontend" to ✅ with the real date (contract, section 4), editing only that row. Final reply: the story path, what was implemented (screens and files in short), the visual check status, the `média`/`baixa` findings with their verdict, and `Next: /erudio:<skill>` following section 10 (usually `/erudio:dev-unit-tests`).
