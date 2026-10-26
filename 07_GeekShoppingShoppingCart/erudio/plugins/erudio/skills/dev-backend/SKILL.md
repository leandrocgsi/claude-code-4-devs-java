---
name: dev-backend
description: Use this skill to implement the backend stage of a GeekShopping story in geek-shopping-api (Spring Boot 4, Java 25), after the plan is approved. Triggers on "implementar o backend", "dev-backend", "codar a API da história", "criar migration, entidade, service e controller da história". Loads the erudio-spring-boot skills, follows the story's Backend section and docs/specs/backend, and updates only the row "Implementação do Backend". It does not write tests, does not touch the frontend and never starts the application.
argument-hint: [story slug or path]
---

# dev-backend

Stage 3 of the story workflow: the Spring Boot code of the story.

Read [`../implement-story/STORY-CONTRACT.md`](../implement-story/STORY-CONTRACT.md) first (fallback path: `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`).

## What this skill never does

- Never writes tests (that is `/erudio:dev-unit-tests` and `/erudio:dev-integration-tests`).
- Never touches `geek-shopping-app/`.
- Never starts the application (`spring-boot:run`) and never runs `StartupTests` (it needs a local MySQL) without asking.
- Never edits a migration that was already applied (V1 and V2 are immutable), never writes a Java migration, never writes Lombok, comments or `getById` overrides in new repositories.
- Never invents a business rule: what the story does not say goes to `## Pontos em aberto` or becomes a question.
- Never runs git writes.

## Step 0 — Story, state and prerequisites

1. Resolve the story from the argument (contract, section 2) and validate the table (section 3).
2. Own row "Implementação do Backend": **⚪** → say the story does not use this stage, do nothing else and suggest the next command (section 10). **✅** → ask before redoing.
3. Prerequisites (section 5): "Plano aprovado" must be ✅ or ⚪. If it is pending, ask whether to run that stage first or proceed anyway.

## Step 1 — Load before coding

**Nothing is generated before this step is done.**

1. With the **Skill tool**, load the `erudio-spring-boot` skills. Always these first three, in this order: `erudio-spring-boot:code-organization`, `erudio-spring-boot:code-style`, `erudio-spring-boot:spring-data-jpa`. Then, according to what the story's Backend section needs: `erudio-spring-boot:flyway-migrations`, `exception-handling`, `bean-validation`, `pagination`, `hateoas`, `swagger`, `web-config`. If the Skill tool cannot load a skill from another plugin, read `erudio-spring-boot-premium/plugins/erudio-spring-boot/skills/<name>/SKILL.md` instead.
2. Read the story: `## Backend`, `## Regras de negócio`, `## Critérios de aceite`, `## Pontos em aberto`.
3. Read `docs/specs/backend/`: the README, `02-arquitetura-e-convencoes.md`, `03-modelo-de-dados-e-migracoes.md`, `04-contrato-da-api.md`, `05-modulos.md` and `07-alinhamento-do-codigo-atual.md`.
4. Read `geek-shopping-api/CLAUDE.md`.
5. **Alignment check.** Look at the area the story touches in `geek-shopping-api/src` and compare it with `07-alinhamento-do-codigo-atual.md`. If the area still diverges from the conventions listed there, ask with `AskUserQuestion`: **align now** (the correction becomes part of this stage and is recorded) or **leave as is** (record it in `## Pontos em aberto`).

## Step 2 — Implement, in this order

All code under `geek-shopping-api/src/main`, package `br.com.erudio`, flat-by-layer, as the loaded skills and the specs say.

1. **Migration** (new file, never an edit): `src/main/resources/db/migration/V{N}__{Description}.sql`, native SQL, DDL before DML, `N` is the next free version (list the folder first). MySQL types as the `flyway-migrations` skill says, no display widths, no Java migration.
2. **Entity** (and enums): `model/`, `Serializable` with `serialVersionUID`, explicit constructors, getters and setters, `equals`/`hashCode` through getters, `@Column` on every field, `BigDecimal` for money, dates as `LocalDate`/`LocalDateTime`/`Instant`, enums with `EnumType.STRING`.
3. **Repository**: `repositories/`, `extends JpaRepository<E, Long>`, JPQL with `@Query`/`@Param` only where needed. **No custom `getById`**: use `findById(...).orElseThrow(ResourceNotFoundException)` in the service. The existing `ProductRepository.getById` is documented as intentional; leave it unless the story says otherwise.
4. **DTOs**: `data/dto/`, `RepresentationModel`, `@Relation`, constraints from Bean Validation on input DTOs.
5. **Service**: `services/`, field `@Autowired`, `DozerMapper` for conversions, business rules from the story, domain exceptions, transactions where the specs ask, HATEOAS links in a private method of the service, `PagedResourcesAssembler` for lists.
6. **Controller and `*ControllerDocs`**: `controllers/` and `controllers/docs/`, routes `/api/<resource>/v1`, JSON only, `produces`/`consumes` on every endpoint, Swagger annotations only in the interface, `@Valid` and parameter constraints only in the interface, status codes as in `04-contrato-da-api.md`.
7. **Config and exceptions**: handler additions, CORS, `application.yml` keys the story needs.

Rules that apply to every file: no comments of any kind, no Lombok, 4 spaces, `var` where the type is obvious, guard clauses on one line, annotations with several arguments one per line.

## Step 3 — Verify

From `geek-shopping-api/`:

```
./mvnw -q clean package -DskipTests
```

It must succeed. If it fails, fix the cause and run again; never mark ✅ with a failing build. Also search the files you created for forbidden things (`lombok`, `//` or `/*` in Java, `bigint(`/`int(11)` in SQL) and fix them.

## Step 4 — Record in "Implementado"

Under `## Implementado` → `### Backend`, replace `_Pendente._` with: the files created and changed (path and purpose); the migrations; the **endpoints** (verb, path, success status); the build command and its result; the `RN` and `AC` covered; the alignment items done or deferred; and, if it ran with a pending prerequisite, that fact. Add the real date.

## Step 5 — Update the row and suggest the next command

If the build passed and there is no open `alta` finding, set "Implementação do Backend" to ✅ with the real date (contract, section 4), editing only that row. Final reply: the story path, what was implemented (files and endpoints in short), the `média`/`baixa` findings with their verdict, and `Next: /erudio:<skill>` following the order of section 10 (usually `/erudio:dev-frontend`).
