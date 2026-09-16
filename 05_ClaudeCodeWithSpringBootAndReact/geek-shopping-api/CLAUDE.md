# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
./mvnw spring-boot:run   # dev server on :8080 (requires MySQL running locally — see application.yml)
./mvnw test               # run all tests
./mvnw test -Dtest=StartupTests               # a single test class
./mvnw test -Dtest=StartupTests#contextLoads  # a single test method
./mvnw clean package       # build the jar (target/)
```

No Docker/compose file exists for MySQL in this repo — `application.yml`'s datasource (`jdbc:mysql://localhost:3306/geek-shopping`, `root`/`admin123`) expects a locally running MySQL instance with that schema created; Flyway then applies `src/main/resources/db/migration/*.sql` on startup. Swagger UI is served at the app root (`http://localhost:8080/`, `springdoc.swagger-ui.use-root-path: true`).

This project follows the **`erudio-spring-boot` Claude Code plugin skills** (source at `../erudio-spring-boot-core`, enabled project-wide — see `../CLAUDE.md`): `code-organization`, `code-style`, `exception-handling`, `flyway-migrations`, `maven-config`, `spring-data-jpa`, `swagger`, `web-config`. Read the relevant skill before touching that concern rather than re-deriving conventions from scratch — the codebase below is small (one domain) and consistent, so deviating from an established pattern stands out immediately.

## Architecture

Single domain (`Product`) demonstrating the full request→response pipeline this course's skills establish. Flat-by-layer packages under `br.com.erudio`, all wired through constructor-less field `@Autowired` (no Lombok anywhere — explicit no-arg constructors, getters/setters, and `equals()`/`hashCode()` built from getters, by hand, on every entity/DTO):

```
Startup.java                          — @SpringBootApplication entrypoint
config/
  WebConfig                           — CORS (from cors.originPatterns, comma-separated) + content negotiation (JSON only, currently)
  OpenApiConfig                       — springdoc OpenAPI bean (title/version/license)
controllers/
  ProductController                   — @RestController, implements ProductControllerDocs, delegates every method straight to ProductService
  docs/ProductControllerDocs           — interface carrying ALL the Swagger annotations (@Operation/@ApiResponse per endpoint) — keeps them out of the controller body
data/dto/ProductDTO                    — extends RepresentationModel<ProductDTO> (HATEOAS), @Relation(collectionRelation = "products")
exception/
  ExceptionResponse                    — record(timestamp, message, details)
  ResourceNotFoundException / RequiredObjectIsNullException — @ResponseStatus domain exceptions
  handler/CustomEntityResponseHandler  — @ControllerAdvice, one @ExceptionHandler method per exception type, each builds its own ExceptionResponse + HttpStatus
mapper/DozerMapper                     — static parseObject/parseListObjects wrapping a shared Dozer Mapper singleton; entity ↔ DTO conversion never happens by hand
model/Product                          — @Entity, table "products"
repositories/ProductRepository          — extends JpaRepository<Product, Long>
services/ProductService                 — business logic + HATEOAS self-links (linkTo(methodOn(ProductController.class)...)); the only layer allowed to touch the repository directly
```

Request flow: `ProductController` (routing + media type + delegates) → `ProductService` (logic, throws domain exceptions, maps entity↔DTO via `DozerMapper`, adds HATEOAS links) → `ProductRepository` (persistence) → MySQL. Uncaught/domain exceptions are turned into an `ExceptionResponse` JSON body by `CustomEntityResponseHandler`, not by the controller.

**`ProductRepository` defines its own `getById(Long id)`** — a `default` method that calls `findById` and throws `ResourceNotFoundException` on a miss. This intentionally shadows `JpaRepository`'s deprecated `getById`. `ProductService` calls this custom one everywhere it looks up a single product; don't "fix" those call sites to `getReferenceById` assuming they mean the JPA method — that was tried once and reverted after reading this interface.

Endpoints (`/api/product/v1`, all JSON): `GET ?page&size&direction` (paged/sorted by `name` only), `GET /{id}`, `POST`, `PUT`, `DELETE /{id}`. `cors.originPatterns` in `application.yml` already includes `http://localhost:3000` for the `geek-shopping-app` frontend in `../geek-shopping-app` — no extra backend config needed to develop both together locally.
