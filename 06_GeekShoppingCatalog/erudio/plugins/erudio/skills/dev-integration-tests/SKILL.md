---
name: dev-integration-tests
description: Use this skill to write the backend integration tests of a GeekShopping story (Testcontainers MySQL, REST Assured, ordered CRUD flows, error paths, filters and pagination), after the backend and its unit tests. Triggers on "testes de integração", "dev-integration-tests", "testar a API ponta a ponta com banco real". Loads erudio-spring-boot:integration-testing, checks Docker first (marks the row blocked if it is unavailable), and updates only the row "Implementação dos testes de Integração". It never changes production code to make a test pass.
argument-hint: [story slug or path]
---

# dev-integration-tests

Stage 7 of the story workflow: integration tests against a real MySQL.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- **Never changes production code so that a test passes.** A defect found is reported as a finding (contract, section 7) and the user is asked.
- **Never weakens, disables or deletes a failing test**, and never loosens an assertion to make it green.
- **Never marks ✅ with a red suite.**
- Never uses H2 or a mocked database, never uses `latest` as the MySQL image tag, never depends on volatile seed data.
- Never starts the application or the frontend by hand, never runs git writes.

## Step 0 — Story, state and prerequisites

1. Resolve the story (contract, section 2) and validate the table (section 3).
2. Own row "Implementação dos testes de Integração": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisites (section 5): "Implementação do Backend", "Implementação do Frontend", "Implementação dos testes de Backend" and "Implementação dos testes de Frontend" each ✅ or ⚪. If any is pending, ask whether to run it first or proceed anyway.
4. **Docker check.** Run `docker info`. If it fails, set the own row to **🚧** with the reason line below the table (contract, section 4, item 5), tell the user what to start, and **stop**. Do not write tests that cannot be run.

## Step 1 — Load before writing

1. With the **Skill tool**, load `erudio-spring-boot:integration-testing`; also `erudio-spring-boot:spring-data-jpa`, `pagination`, `hateoas` and `swagger` for the repository tests and the assertions. Fallback: read `erudio-spring-boot-premium/plugins/erudio-spring-boot/skills/<name>/SKILL.md`.
2. Read the story: `## Regras de negócio`, `## Critérios de aceite`, `## Testes`, `## Implementado` (backend endpoints).
3. Read `docs/specs/backend/06-qualidade-e-testes.md`, `04-contrato-da-api.md` and `geek-shopping-api/CLAUDE.md`.
4. Read the existing `src/test` tree (the abstract container class, test configs, DTO mirrors) and reuse it.

## Step 2 — Write the tests

Under `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/`, JSON only.

- **Infrastructure (if missing):** `AbstractIntegrationTest` with the Testcontainers MySQL started once per JVM and a **pinned image tag** (for example `mysql:9.1.0`); `TestConfigs` (port 8888, origins, header names); test `application.yml` as the spec says; test dependencies and the surefire `argLine` in `pom.xml` if absent.
- **Controller flows:** one class per controller with `@TestMethodOrder(OrderAnnotation)`: create, read, update, list, delete, in that order, sharing state in static fields. The class is always run whole, never a single method.
- **Error paths:** `400` (validation, with the `ProblemDetail` `errors` map; invalid parameters), `404`, and `409` when the story defines it. Assert the status **and** the body shape.
- **Filters and pagination:** the filters of the story combined, `sortBy` accepted and rejected values, `page`/`size` limits, `_embedded`, `page` metadata and the `self`/`first`/`prev`/`next`/`last` links (no `prev` on the first page, no `next` on the last).
- **No volatile seed:** each test creates what it needs through the API or fixed seed rows; never depend on counts or order of data the migrations may change, and use `id` as a tie-break when ordering.
- **CORS and Swagger** tests if the story touched them (including the `X-Cart-Token` header when the story uses it).
- **Repository tests** (`@DataJpaTest` with the container) for custom `@Query` that the unit stage did not cover.
- No comments, no Lombok. The test DTO mirrors live in `integrationtests/dto/`.
- If the story's `## Testes` includes an end-to-end flow in the browser, write its Playwright spec under `geek-shopping-app/e2e/*.spec.ts`; it is **run by the user** (it needs the backend and the app running), and the record says so.

## Step 3 — Verify

From `geek-shopping-api/`, with Docker confirmed:

```
./mvnw test
```

All tests must pass. If a test fails, fix the test honestly or report a production defect; do not touch the production code. If the only failure is the existing `StartupTests` for lack of a local MySQL, apply the same rule as the unit stage: do not touch it, tell the user, ask how to proceed, and record exactly what ran. For Playwright, run `npx playwright test --list` and `npx tsc --noEmit` in the app to check that the specs are valid; the real E2E result comes from the user. Without the user's E2E result, say so in the record; if the story requires the E2E, the row stays ⏳ until the user reports it.

## Step 4 — Record in "Implementado"

Under `## Implementado` → `### Testes de Integração`: test classes created and what each covers, the `RN`/`AC` → test mapping, the pinned image, the command and its result (counts), what was not run and why, the E2E spec status. Add the real date.

## Step 5 — Update the row and suggest the next command

If the suite is green and there is no open `alta` finding, set "Implementação dos testes de Integração" to ✅ with the real date, editing only that row. Final reply: story path, tests created, results, the `média`/`baixa` findings with their verdict, and `Next: /erudio:<skill>` following section 10 (usually `/erudio:agent-code-review`).
