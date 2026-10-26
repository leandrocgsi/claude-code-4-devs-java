---
name: dev-ui-tests
description: Use this skill to write the frontend tests of a GeekShopping story in geek-shopping-app (Vitest, Testing Library, optional MSW), after the frontend stage. Triggers on "testes do frontend", "dev-ui-tests", "testar os componentes da história", "cobrir o adaptador HAL e os hooks com testes". Loads erudio-frontend:scaffold, writes tests in __test__/ for services, hooks, stores and new components in their three states, runs vitest, tsc and lint, and updates only the row "Implementação dos testes de Frontend". It never changes production code to make a test pass and never starts the dev server.
argument-hint: [story slug or path]
---

# dev-ui-tests

Stage 6 of the story workflow: frontend tests.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- **Never changes production code so that a test passes.** A defect found by a test is reported as a finding (contract, section 7) and the user is asked; it is not fixed from here.
- **Never weakens, skips (`it.skip`, `xit`) or deletes a failing test**, and never loosens an assertion to make it green.
- **Never marks ✅ with a red suite**, a failing `tsc` or a failing lint.
- Never starts `npm run dev` or any server, never touches `geek-shopping-api/`, never runs git writes.
- Never writes E2E (Playwright) specs: they belong to `/erudio:dev-integration-tests`.

## Step 0 — Story, state and prerequisites

1. Resolve the story (contract, section 2) and validate the table (section 3).
2. Own row "Implementação dos testes de Frontend": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisite (section 5): "Implementação do Frontend" ✅ or ⚪. If pending, ask whether to run it first or proceed anyway.

## Step 1 — Load before writing

1. With the **Skill tool**, load `erudio-frontend:scaffold` (testing conventions). Fallback: read `erudio-frontend-premium/plugins/erudio-frontend/skills/scaffold/SKILL.md`.
2. Read the story: `## Regras de negócio`, `## Critérios de aceite`, `## Testes`, `## Implementado` → `### Frontend`.
3. Read `docs/specs/frontend/06-qualidade-e-testes.md`, `03-dados-e-contrato-com-a-api.md` and `geek-shopping-app/CLAUDE.md`.
4. Read the code under test and the existing tests, `vitest.config.ts` and `vitest.setup.ts`.

## Step 2 — Write the tests

Vitest + Testing Library, in `__test__/` next to the code (`<Name>.test.ts(x)`), globals as configured. Prefer accessible roles and labels over `data-testid`.

- **Services (`app/core/api`):** the **HAL adapter** with `_embedded` and without it (empty page), `first`/`last` derived from the links or page data; **error normalization** (`ExceptionResponse`, `ProblemDetail` with `errors{}`, no response); the **`Location`** header on creation when the contract returns it. When HTTP is mocked, follow the spec: MSW handlers with the real contract. If MSW is not installed and the story's `## Testes` calls for it, ask before adding it (`npm install -D msw`, then `npm audit`).
- **Hooks:** the query key contains the filters; changing a filter resets the page to 0; mutations invalidate the right keys; error state is exposed. Use a `QueryClient` wrapper without retries.
- **Stores:** state transitions through the facade hooks (and `persist` hydration if the story adds it, including unavailable `localStorage`).
- **New components:** each one in its **three states** (carregando, vazio, erro) plus the success state, and the interactions the story defines (quantity changes, filters, form errors by field). Server data is never read from a Zustand store in the tests.
- No comments in the tests. Keep test names in English.

If the exclusions in `vitest.config.ts` hide `app/core/api` or `app/store` from coverage and this story adds tests for them, adjust only that configuration and record it.

## Step 3 — Verify

From `geek-shopping-app/`, all must pass:

```
npx vitest run
npx tsc --noEmit
npm run lint
```

Fix test failures at their cause; if the cause is production code, report it and ask. Check that every `RN` of the story has at least one test and keep the mapping `RN-n → test` for the record.

## Step 4 — Record in "Implementado"

Under `## Implementado` → `### Testes de Frontend`: test files created, the `RN`/`AC` → test mapping, the three commands and their results (test counts), dependencies added, and any production defect found. Add the real date.

## Step 5 — Update the row and suggest the next command

If everything passed and there is no open `alta` finding, set "Implementação dos testes de Frontend" to ✅ with the real date, editing only that row. Final reply: story path, tests created, results, the `média`/`baixa` findings with their verdict, and `Next: /erudio:<skill>` following section 10.
