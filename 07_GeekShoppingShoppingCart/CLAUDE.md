# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Course stage folder (read this first)

This folder, `07_GeekShoppingShoppingCart`, is **one stage snapshot** of the course "Claude Code with Spring Boot and React". The course keeps every stage of the same project as a numbered sibling folder in the same Git repository (`02_`, `04_`, `05_`, `06_GeekShoppingCatalog`, this one, and the ones that come next) instead of using branches. Each stage starts as a copy of the previous one and then evolves.

Rules for working here:

- **Treat this folder as the whole project.** Behave as if the other stage folders did not exist: do not read, search, edit, compare against or cite code, docs, plans or specs from them, and do not run commands from the parent directory. Always work, search and run tools inside this folder.
- Everything the workflow needs lives here: `geek-shopping-api/`, `geek-shopping-app/`, `docs/` (macroplan, specs, stories), `scripts/`, `erudio/` and the other plugin sources. Relative paths in docs, skills and settings are relative to this folder.
- The stories in `docs/plans/stories/` are the history of this project up to this stage; the closed ones describe what already exists in the code here, and the next story is planned from the macroplan (`docs/plans/macroplano-geek-shopping.md`).
- Plugin sources are edited **only in the current stage folder**. The six plugin marketplaces (`erudio-marketplace`, `erudio-spring-boot-marketplace`, `erudio-frontend-marketplace`, `erudio-cicd-marketplace`, `erudio-devops-marketplace`, `erudio-git-marketplace`) are registered at user level, and a marketplace name can point to one folder at a time. They must point to the newest stage folder.
- **When a new stage folder is created** (a copy of this one), repoint them, then run `/reload-plugins`:
  ```bash
  sed -i 's/07_GeekShoppingShoppingCart/<NN_NewFolder>/g' ~/.claude/settings.json ~/.claude/plugins/known_marketplaces.json
  ```
  Check with `claude plugin marketplace list`: every `erudio*` source must show the new folder. Also create the new folder's `.claude/settings.json` from this one (the `./erudio` marketplace path is relative) and update the name in this section and in the root `.gitignore` if it names a folder (today it uses `**/erudio/plugins/erudio/skills/`, which needs no change).
- Do not "fix" differences between stages: the earlier folders are frozen on purpose so students can compare them.

## What this repository is

This is a course-module workspace, not a single app. It holds several independent projects side by side — there is no root build, no monorepo tool (no npm workspaces, no Maven aggregator POM), and no shared dependency graph. Always `cd` into the specific project below before running its commands.

```
geek-shopping-api/           Spring Boot backend
geek-shopping-app/           Next.js frontend that consumes it
MultiShop/                    third-party HTML/CSS/JS template — the literal visual reference the frontend was ported from
docs/                         macroplan (docs/plans), stories (docs/plans/stories), specs (docs/specs/backend, docs/specs/frontend)
scripts/                      one-off tooling (generate_product_images_migration.py builds the seed migration with the product images)
erudio/                       source of the "erudio" plugin: the story workflow (skills + reviewer agents)
erudio-spring-boot-premium/   source of the "erudio-spring-boot" plugin (backend skills)
erudio-frontend-premium/      source of the "erudio-frontend" plugin (frontend skills)
erudio-cicd-core/             source of the "erudio-cicd" plugin (CI/CD pipeline skills)
erudio-devops/                source of the "erudio-devops" plugin (Docker/Compose/Kubernetes skills)
erudio-git/                   source of the "erudio-git" plugin (commit-message skill)
.claude/settings.json         which plugins are enabled for this project
```

## The Claude Code plugins active in this workspace

`.claude/settings.json` enables `erudio`, `erudio-spring-boot`, `erudio-frontend`, `erudio-cicd`, `erudio-devops` and `erudio-git` (each `@<name>-marketplace`) at project scope. `erudio-marketplace` is also declared in the project settings (`./erudio`, relative to this folder); all six marketplaces are registered in the user's `~/.claude/settings.json` (`extraKnownMarketplaces`) as folder sources pointing at the directories above (see "Course stage folder" for how they follow the newest stage). The last three have no skills referenced below.

- **`erudio` (story workflow)** (`erudio/plugins/erudio/`): `implement-story` plans a story into `docs/plans/stories/<slug>.md` (11-row stage table, rules, acceptance criteria), then one skill per stage updates only its own row: `dev-backend`, `dev-frontend`, `dev-unit-tests`, `dev-ui-tests`, `dev-integration-tests`, `agent-code-review`, `agent-perf-review`, `agent-security-review`, `agent-tech-debt` (the only one without a row; it runs once, between the security review and the closing) and `complete-story`. The agents `code-reviewer`, `perf-reviewer`, `security-reviewer` and `tech-debt-reviewer` are read-only. The contract that every skill follows is `erudio/plugins/erudio/skills/implement-story/STORY-CONTRACT.md`. Commits are never made by Claude; only suggested (`erudio-git:commit-message`).
- **`erudio-spring-boot` skills** (`erudio-spring-boot-premium/plugins/erudio-spring-boot/skills/`) govern all Java work in `geek-shopping-api`: `code-organization` (flat-by-layer packages under `br.com.erudio`, the `*ControllerDocs` interface pattern), `code-style` (no Lombok — ever; explicit constructors and `equals()`/`hashCode()` via getters; specific `var`/guard-clause/annotation formatting), `exception-handling` (`ExceptionResponse` record, `@ResponseStatus` domain exceptions, one `@ExceptionHandler` per exception), `flyway-migrations` (`V{N}__{Description}.sql` naming, MySQL DDL/DML type conventions), `maven-config`, `spring-data-jpa` (entities, repositories, DTO + DozerMapper conversion, HATEOAS links added in the service layer), `swagger` (`OpenApiConfig`, springdoc YAML, the `*ControllerDocs` pattern), `web-config` (CORS + content negotiation, the three media types every endpoint declares).
- **`erudio-frontend` skills** (`erudio-frontend-premium/plugins/erudio-frontend/skills/`) are `scaffold` (generates a new Next.js App Router project's architecture — stack, folder structure, component/state/data patterns — with a neutral, unbranded design system) and `visual-identity` (applies a real visual identity afterward, either by porting a real prototype/template screen-by-screen ("Port mode") or generating one from two brand colors ("Generic mode")). `geek-shopping-app` was built with `scaffold` and then branded with `visual-identity` in Port mode against `MultiShop/`.

To add another plugin, register its folder as a marketplace (`claude plugin marketplace add <folder>`) and then `claude plugin install <plugin>@<marketplace> --scope project`.

## geek-shopping-api (backend)

Spring Boot 4.1.1, Java 25, Maven (`./mvnw`). MySQL + Flyway (`src/main/resources/db/migration`, V1–V5 today), package-by-layer under `br.com.erudio` (`config`, `controllers` + `controllers/docs`, `data/dto` + `data/dto/request`, `exception` + `exception/handler`, `file`, `mapper`, `model`, `repositories`, `services`, `validation`). DTOs are mapped with Dozer, not manually or via MapStruct. Swagger UI is served at the app root (`springdoc.swagger-ui.use-root-path: true`); `application.yml`'s `cors.originPatterns` already allows `http://localhost:3000` (the frontend) alongside `:8080`.

The catalog (`/api/product/v1`) has filters, sorting, facets, featured/recent and categories endpoints, and creates/updates products with `multipart/form-data` (a `product` JSON part plus an optional `image`). Product images are stored in the database (BLOB, separate `ProductImage` entity) and served from `GET /api/product/v1/{id}/image`.

```bash
cd geek-shopping-api
./mvnw spring-boot:run     # dev server on :8080 (needs the local MySQL from application.yml)
./mvnw test                # needs Docker: Testcontainers MySQL (mysql:9.1.0); integration tests listen on :8888
./mvnw clean package
```

The `ProductRepository` defines its own `getById(Long id)` default method (throwing `ResourceNotFoundException` when missing) that intentionally shadows `JpaRepository`'s deprecated `getById` — don't "fix" call sites to `getReferenceById` assuming they mean the JPA method; check the repository interface first.

## geek-shopping-app (frontend)

Next.js (App Router) + TypeScript, consuming `geek-shopping-api` through `NEXT_PUBLIC_API_URL`. There is no mock catalog anymore: Home, shop, product detail and `/admin/products` (create/edit/delete with image upload and crop) read and write the real API; the cart is still local (Zustand) until the cart story. Its entire visual design is a deliberate, literal port of `MultiShop/` — any layout/visual change there should be checked against those actual template files, not against memory. It has its own `CLAUDE.md` — read `geek-shopping-app/CLAUDE.md` before working there rather than duplicating it here.

```bash
cd geek-shopping-app
npm install
npm run dev    # :3000
npx vitest run # unit/UI tests (Vitest + Testing Library + MSW)
npm run e2e    # Playwright; needs the API on :8080 and the app on :3000
```

## MultiShop (reference template — read-only)

A free HTML/CSS/JS template ("MultiShop" by HTML Codex, `MultiShop/READ-ME.txt` / `LICENSE.txt`) licensed under Creative Commons Attribution 4.0 International — it can be used and modified, but the author's attribution link may not be removed without buying the paid Pro version. `geek-shopping-app`'s footer carries this attribution for that reason; never remove it. This folder is a reference to read, not a project to build or run.
