# 07 — Alinhamento do código atual

Comparação entre as convenções (skills `erudio-spring-boot` e [02](02-arquitetura-e-convencoes.md)) e o estado atual de `geek-shopping-api`. Linhas conferidas no código. "Entrega" é a entrega do macroplano em que a correção entra.

## Divergências

| # | Convenção | Código atual | Ação | Entrega |
|---|---|---|---|---|
| 1 | Dinheiro em `BigDecimal` | `Double price` em `Product.java:30` e `ProductDTO.java:17`; coluna já é `decimal(65,2)` | Trocar para `BigDecimal` na entidade, no DTO e nos getters/setters | 1 |
| 2 | Listagem como `PagedModel` via `PagedResourcesAssembler`, parâmetros `page/size/direction` com teto | `findAll` devolve `Page<ProductDTO>` cru (`ProductController.java:36`, `ProductService.java:36`); sem teto de `size`; ordenação fixa por `name`; sem `sortBy` | Adotar `PagedModel`, `buildPagedModel` privado no service, teto de `size`, `sortBy` com whitelist | 1 |
| 3 | `spring-boot-starter-validation`, `@Valid`, constraints nos DTOs | Sem a dependência; sem constraints; `@RequestBody` sem `@Valid` (`ProductController.java:53,59`); POST sem `name` estoura no banco e vira 500 | Adicionar a dependência, constraints e `@Valid` (só na interface `*ControllerDocs`) | 1 |
| 4 | Handler repõe `type = about:blank` e trata os dois hooks de validação | `CustomEntityResponseHandler` não sobrescreve `createResponseEntity` nem os hooks de validação; catch-all usa `ex.getMessage()` (`:26`) | Sobrescrever os três métodos; catch-all com mensagem genérica | 1 |
| 5 | Exceções com `serialVersionUID`; `BadRequestException` | `ResourceNotFoundException.java:7` e `RequiredObjectIsNullException.java:7` sem `serialVersionUID`; sem `BadRequestException` | Adicionar `serialVersionUID`, `BadRequestException` e `ConflictException` (proposta) | 1 |
| 6 | Migrations sem display width | `V1` com `bigint(20)` e `int(11)` (`V1__Create_Table_Products.sql:2,8`) | Corrigir com migration nova (V3). **Não editar V1.** | 1 |
| 7 | Migrations só em SQL nativo | Já conforme (V1 e V2 são `.sql`) | Manter; proibir migrations em Java e inner classes | todas |
| 8 | `spring-boot-starter-flyway` + `flyway-mysql` | `flyway-core` + `flyway-mysql` | Trocar para o starter | 1 |
| 9 | `spring-boot-starter-hateoas` | `org.springframework.hateoas:spring-hateoas` direto | Trocar para o starter | 1 |
| 10 | `spring-boot-starter-webmvc` (nome modular do Boot 4) | `spring-boot-starter-web` (`pom.xml:37`) | Trocar | 1 |
| 11 | Dependências e plugins de teste | Só `spring-boot-starter-test`; sem Testcontainers, REST Assured, `data-jpa-test`, surefire com Mockito agent | Adicionar (ver [06](06-qualidade-e-testes.md)) | 1 |
| 12 | 4 espaços, sem tabs | `pom.xml` indentado com TAB; `Startup.java` e `StartupTests.java` também | Reindentar | 1 |
| 13 | `pom.xml` limpo | `<name/>`, `<description/>`, `<url/>`, `<licenses>`, `<developers>`, `<scm>` vazios e comentário `<!-- lookup parent from repository -->` do Initializr (`pom.xml:9,14-28`); `artifactId` é `geek-shopping` (`:12`) | Limpar e preencher `name`/`description` | 1 |
| 14 | Segredos via `${ENV:default}`, `check_nullability: true` | `username: root` / `password: admin123` em texto puro (`application.yml:10-11`); sem `check_nullability` | Variáveis de ambiente com default; ligar `check_nullability` | 1 |
| 15 | Swagger fiel ao comportamento real | `Page` documentado como array e 204 que nunca ocorre em `findAll`; `create` descrito como "Created" com 200 (`ProductControllerDocs.java:56`); 400/500 sem corpo; sem `@Parameter` de paginação; `@Tag` duplicado (`ProductController.java:28` e `ProductControllerDocs.java:20`) | Alinhar às anotações compostas e aos status reais; `@Tag` só no controller | 1 |
| 16 | Todo endpoint declara `produces` | `@DeleteMapping("/{id}")` sem `produces` (`ProductController.java:63`) | Declarar | 1 |
| 17 | `equals` em várias linhas | `Product.java:103` e `ProductDTO.java:84` com tudo em uma linha | Reformatar | 1 |
| 18 | Testes além do `contextLoads` | Só `StartupTests.contextLoads()`, que exige MySQL local | Estrutura de [06](06-qualidade-e-testes.md) | 1 em diante |
| 19 | Não sobrescrever `getById` do JPA | `ProductRepository.getById` default customizado (`ProductRepository.java:10`), usado em `ProductService.java:30,58,72` | Exceção documentada no `CLAUDE.md` do projeto; decidir no plano micro do catálogo | 1 |
| 20 | Pacote `repository`, mapper `ObjectMapper` (citados pela skill) | Pacote `repositories` e `DozerMapper` | Desvio aceito; manter | — |
| 21 | Perfis | Arquivo único, sem `dev`/`prod` | As skills não exigem; melhoria futura | — |

## Em conformidade

- Injeção por `@Autowired` em campo (`ProductController.java:31`, `ProductService.java:25`): é o padrão da skill `code-organization` e do `CLAUDE.md` do projeto.
- `decimal(65,2)` para preço no banco.
- `@ControllerAdvice` + `@RestController` no handler, estendendo `ResponseEntityExceptionHandler`, com um `@ExceptionHandler` por exceção.
- `ExceptionResponse` como `record`.
- `Startup` e `StartupTests`.
- Sem Lombok; construtores, getters e setters explícitos.
- Dozer como mapper.
- Interface `ProductControllerDocs` para as anotações do Swagger.
- Links HATEOAS montados no service.
- Nomes de migration (`V1__Create_Table_Products.sql`, `V2__Insert_Data_In_Products.sql`).
- `ddl-auto: none` e `open-in-view: false`.
- CORS por `cors.originPatterns`, já com `http://localhost:3000`.

## Ordem sugerida de correção na entrega 1

1. `pom.xml` (starters, dependências de teste, indentação, limpeza) e `application.yml`.
2. Exceções e handler (itens 4 e 5), com validação (item 3).
3. Migration V3 e `BigDecimal` (itens 1 e 6).
4. Paginação (item 2) junto com a evolução do catálogo.
5. Swagger e testes (itens 15, 16, 18), conforme cada endpoint ganha seu contrato final.
