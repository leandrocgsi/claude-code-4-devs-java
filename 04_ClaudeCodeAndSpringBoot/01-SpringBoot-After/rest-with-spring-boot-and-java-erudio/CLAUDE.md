# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Spring Boot 4.1 REST API (Java 25) exposing CRUD operations for a `Person` resource, backed by MySQL via Spring Data JPA. This module lives inside a larger multi-lesson course repository; treat this directory (`rest-with-spring-boot-and-java-erudio`) as the project root for build/test purposes.

## Commands

There is no Maven wrapper in this project — use the system-installed `mvn` (requires JDK 25 on the PATH).

- Build: `mvn clean compile`
- Package: `mvn clean package`
- Run the app: `mvn spring-boot:run` (or run the `Startup` class directly)
- Run all tests: `mvn test`
- Run a single test: `mvn test -Dtest=StartupTests#contextLoads`

**Known issue:** `mvn test` currently fails out of the box. `src/test/resources/application.yml` has no datasource properties, so `StartupTests` (a full `@SpringBootTest`) cannot build a `DataSource` bean and the context fails to load. Add MySQL (or an in-memory/test database) connection properties to that file before tests will pass.

Running the app requires a reachable MySQL instance matching `src/main/resources/application.yml` (`jdbc:mysql://localhost:3306/claude-code-4-devs-java`, user `root`). `spring.jpa.hibernate.ddl-auto` is set to `update`, so the schema is created/updated automatically from the JPA entities on startup.

## Architecture

**Layering:** `PersonController` (`controllers/`) → `PersonServices` (package root `br.com.erudio`) → `PersonRepository` (`repository/`, Spring Data `JpaRepository<Person, Long>`) → MySQL. The only API surface currently is `/person` (GET list, GET by id, POST, PUT, DELETE), all consuming/producing `PersonDTO` JSON.

**Entity vs. DTO boundary:** `model.Person` is the JPA `@Entity` and is never exposed over HTTP. `dto.PersonDTO` is the request/response POJO. Conversion happens exclusively through `mapper.PersonMapper`, a MapStruct interface (`@Mapper(componentModel = "spring")`) whose implementation (`PersonMapperImpl`) is generated at compile time under `target/generated-sources/annotations`. ModelMapper was deliberately removed in favor of MapStruct: ModelMapper's reflective generic-type resolution calls a terminally-deprecated `sun.misc.Unsafe` method that JDK 24+ warns about on every startup, and that warning cannot be fixed by version-bumping or suppressing flags — only a compile-time (reflection-free) mapper avoids it. Keep using MapStruct for any new entity↔DTO mapping rather than reintroducing a runtime mapping library.

`PersonDTO` carries `@JsonPropertyOrder({"id", "firstName", "lastName", "address", "gender"})` to keep JSON field order stable and matching the POJO's declared order — Jackson's default reflection-based ordering is not guaranteed otherwise.

**Global exception handling:** `exception/handler/CustomEntityResponseHandler` (`@RestControllerAdvice`) catches generic `Exception` (→ 500) and `UnsupportedMathOperationException` (→ 400), returning an `ExceptionResponse` record (`timestamp`, `message`, `details`). `UnsupportedMathOperationException` has no thrower or controller anywhere in this codebase yet — it's exception-handling scaffolding carried over from the course template, not dead code to remove without checking with the project owner first.

`spring.jpa.open-in-view` is explicitly set to `false` (overriding the Spring Boot default of `true`). DTO mapping happens inside `PersonServices` methods, so no lazy-loading is needed once the HTTP layer runs — keep new service methods doing their entity work (including any lazy associations) before returning a DTO.

## Conventions

- No code comments anywhere in this codebase (Javadoc, inline, or block) — this is an explicit, standing preference of the project owner. Match it in any new or edited code.
