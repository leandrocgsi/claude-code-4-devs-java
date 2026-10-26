---
name: dev-unit-tests
description: Use this skill to write the backend unit tests of a GeekShopping story in geek-shopping-api (JUnit, Mockito, service and mapper tests), after the backend stage. Triggers on "testes unitários do backend", "dev-unit-tests", "testar os services da história", "cobrir as regras de negócio com testes". Loads erudio-spring-boot:testing and code-style, writes one test per business rule of the story, runs ./mvnw test and updates only the row "Implementação dos testes de Backend". It never changes production code to make a test pass.
argument-hint: [story slug or path]
---

# dev-unit-tests

Stage 5 of the story workflow: backend unit tests.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- **Never changes production code so that a test passes.** If a test exposes a defect, report it as a finding (contract, section 7) and ask; do not "fix" the code from here.
- **Never weakens, disables or deletes a failing test**, and never loosens an assertion to turn it green.
- **Never marks ✅ with a red suite.**
- Never tests controllers or the exception handler (they belong to the integration tests); never uses `@SpringBootTest` or `@MockitoBean` in a unit test.
- Never touches the frontend, never starts the application, never runs git writes.

## Step 0 — Story, state and prerequisites

1. Resolve the story (contract, section 2) and validate the table (section 3).
2. Own row "Implementação dos testes de Backend": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisite (section 5): "Implementação do Backend" ✅ or ⚪. If pending, ask whether to run it first or proceed anyway.

## Step 1 — Load before writing

1. With the **Skill tool**, load `erudio-spring-boot:testing` and `erudio-spring-boot:code-style`. For link and pagination assertions also load `erudio-spring-boot:hateoas` and `erudio-spring-boot:pagination`; for the repository tests load `erudio-spring-boot:spring-data-jpa`. Fallback: read `erudio-spring-boot-premium/plugins/erudio-spring-boot/skills/<name>/SKILL.md`.
2. Read the story: `## Regras de negócio`, `## Critérios de aceite`, `## Testes`, and `## Implementado` → `### Backend` (the list of what exists).
3. Read `docs/specs/backend/06-qualidade-e-testes.md` and `geek-shopping-api/CLAUDE.md`.
4. Read the production classes being tested and the existing tests and `Mock*` builders in `geek-shopping-api/src/test` (reuse them).

## Step 2 — Write the tests

Under `geek-shopping-api/src/test/java/br/com/erudio/unittests/`.

- **Builders:** `Mock<Entity>` classes with `mockEntity(n)`, `mockDTO(n)` and list builders, predictable values.
- **Service tests:** `@ExtendWith(MockitoExtension.class)`, `@InjectMocks` on the service, `@Mock` on collaborators, no `openMocks`. **One business rule of the story per test**, named after the rule (`RN-n`): happy path, `ResourceNotFoundException`, null input (`RequiredObjectIsNullException`), each rule violation. `verify` the calls that matter.
- **HATEOAS links:** assert each link by **suffix**: `links.stream().anyMatch(l -> l.getRel().value().equals("...") && l.getHref().endsWith("...") && l.getType().equals("..."))` inside `assertTrue`. Never assert on `anyMatch` with `assertNotNull`.
- **Pagination:** mock `PagedResourcesAssembler` and stub `toModel(any(Page.class), any(Link.class))`.
- **Mapper tests:** conversions entity ↔ DTO, lists, null handling.
- **Repository tests:** `@DataJpaTest` **only for custom `@Query`**, with the Testcontainers MySQL as in `erudio-spring-boot:spring-data-jpa`. These need Docker: run `docker info` first; if Docker is unavailable, do not write them silently, ask whether to skip them (record it in `## Pontos em aberto`) or to block (🚧 with the reason).
- No comments, no Lombok. Add the Mockito agent to the surefire `argLine` in `pom.xml` only if it is missing.

## Step 3 — Verify

From `geek-shopping-api/`:

```
./mvnw test
```

The suite must be green. If a new test fails, the cause is either the test (fix the test honestly) or the production code (report it, do not edit the code). If the only failure is the existing `StartupTests` for lack of a local MySQL, that is an environment condition: do not touch that test; tell the user and ask whether MySQL is available to run the full suite or whether to accept a run limited to the new tests (`./mvnw test -Dtest='<new classes>'`), and record exactly what was and was not run. Without that answer the row stays ⏳.

Check that every `RN` of the story has at least one test, and list the mapping `RN-n → test` in the record.

## Step 4 — Record in "Implementado"

Under `## Implementado` → `### Testes de Backend`: test classes created, the `RN`/`AC` → test mapping, the command and its result (counts of tests, failures), what was not run and why, and any production defect found. Add the real date.

## Step 5 — Update the row and suggest the next command

If the suite is green (or the run was explicitly accepted as limited) and there is no open `alta` finding, set "Implementação dos testes de Backend" to ✅ with the real date, editing only that row. Final reply: story path, tests created, result, the `média`/`baixa` findings with their verdict, and `Next: /erudio:<skill>` following section 10.
