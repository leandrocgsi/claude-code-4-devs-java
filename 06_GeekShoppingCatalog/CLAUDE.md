# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a course-module workspace ("Claude Code with Spring Boot and React"), not a single app. It holds several independent projects side by side — there is no root build, no monorepo tool (no npm workspaces, no Maven aggregator POM), and no shared dependency graph. Always `cd` into the specific project below before running its commands.

```
geek-shopping-api/       Spring Boot backend
geek-shopping-app/       Next.js frontend that consumes it
MultiShop/                third-party HTML/CSS/JS template — the literal visual reference the frontend was ported from
erudio-spring-boot-core/  source of the "erudio-spring-boot" Claude Code plugin (backend skills)
erudio-frontend-core/     source of the "erudio-frontend" Claude Code plugin (frontend skills)
install-plugin.sh         extracts a course plugin .zip and registers+installs+enables it in Claude Code
.claude/settings.json     which plugins are enabled for this project
```

## The two Claude Code plugins active in this workspace

`.claude/settings.json` enables `erudio-spring-boot@erudio-spring-boot-marketplace` and `erudio-frontend@erudio-frontend-marketplace` at project scope. Their source lives in `erudio-spring-boot-core/` and `erudio-frontend-core/` (each a `.claude-plugin/` marketplace root + `plugins/<name>/skills/*`) — these are what a session in this workspace actually loads as skills, and they encode the conventions the two apps below were built to follow:

- **`erudio-spring-boot` skills** (`erudio-spring-boot-core/plugins/erudio-spring-boot/skills/`) govern all Java work in `geek-shopping-api`: `code-organization` (flat-by-layer packages under `br.com.erudio`, the `*ControllerDocs` interface pattern), `code-style` (no Lombok — ever; explicit constructors and `equals()`/`hashCode()` via getters; specific `var`/guard-clause/annotation formatting), `exception-handling` (`ExceptionResponse` record, `@ResponseStatus` domain exceptions, one `@ExceptionHandler` per exception), `flyway-migrations` (`V{N}__{Description}.sql` naming, MySQL DDL/DML type conventions), `maven-config`, `spring-data-jpa` (entities, repositories, DTO + DozerMapper conversion, HATEOAS links added in the service layer), `swagger` (`OpenApiConfig`, springdoc YAML, the `*ControllerDocs` pattern), `web-config` (CORS + content negotiation, the three media types every endpoint declares).
- **`erudio-frontend` skills** (`erudio-frontend-core/plugins/erudio-frontend/skills/`) are `scaffold` (generates a new Next.js App Router project's architecture — stack, folder structure, component/state/data patterns — with a neutral, unbranded design system) and `visual-identity` (applies a real visual identity afterward, either by porting a real prototype/template screen-by-screen ("Port mode") or generating one from two brand colors ("Generic mode")). `geek-shopping-app` was built with `scaffold` and then branded with `visual-identity` in Port mode against `MultiShop/`.

To install one of the course's other plugin `.zip`s the same way, use `./install-plugin.sh <path-to-zip> [--scope user|project|local]` — it discovers the plugin/marketplace name from the zip itself, and deliberately keeps the extracted folder afterward (Claude Code re-reads it later; it is not a one-time copy).

## geek-shopping-api (backend)

Spring Boot 4.1.1, Java 25, Maven (`./mvnw`). MySQL + Flyway (`src/main/resources/db/migration`), package-by-layer under `br.com.erudio` (`config`, `controllers` + `controllers/docs`, `data/dto`, `exception` + `exception/handler`, `mapper`, `model`, `repositories`, `services`). DTOs are mapped with Dozer, not manually or via MapStruct. Swagger UI is served at the app root (`springdoc.swagger-ui.use-root-path: true`); `application.yml`'s `cors.originPatterns` already allows `http://localhost:3000` (the frontend) alongside `:8080`.

```bash
cd geek-shopping-api
./mvnw spring-boot:run     # dev server on :8080
./mvnw test
./mvnw clean package
```

The `ProductRepository` defines its own `getById(Long id)` default method (throwing `ResourceNotFoundException` when missing) that intentionally shadows `JpaRepository`'s deprecated `getById` — don't "fix" call sites to `getReferenceById` assuming they mean the JPA method; check the repository interface first.

## geek-shopping-app (frontend)

Next.js (App Router) + TypeScript, consuming `geek-shopping-api`. Has its own `CLAUDE.md`, `README.md`, and `ARCHITECTURE.md` — read `geek-shopping-app/CLAUDE.md` before working there rather than duplicating it here. In short: it currently runs on an in-memory mock catalog (`USE_MOCK_PRODUCT_DATA` flag) because the live API's product images are broken, and its entire visual design is a deliberate, literal port of `MultiShop/` — any layout/visual change there should be checked against those actual template files, not against memory.

```bash
cd geek-shopping-app
npm install
npm run dev    # :3000
```

## MultiShop (reference template — read-only)

A free HTML/CSS/JS template ("MultiShop" by HTML Codex, `MultiShop/READ-ME.txt` / `LICENSE.txt`) licensed under Creative Commons Attribution 4.0 International — it can be used and modified, but the author's attribution link may not be removed without buying the paid Pro version. `geek-shopping-app`'s footer carries this attribution for that reason; never remove it. This folder is a reference to read, not a project to build or run.
