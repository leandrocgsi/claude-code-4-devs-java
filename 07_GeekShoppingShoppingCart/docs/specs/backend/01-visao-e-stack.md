# 01 — Visão e stack

## Objetivo

Evoluir o `geek-shopping-api` de um CRUD de produtos para a API de um e-commerce: catálogo com filtros, carrinho, checkout, pedido, cupom e pagamento simulado, consumida pelo `geek-shopping-app`.

## Escopo por entrega

Segue a ordem do [macroplano](../../plans/macroplano-geek-shopping.md).

| # | Entrega | Participação do back |
|---|---|---|
| 1 | Cadastro de produtos | Catálogo completo: `Category`, `Color`, `Size`, `Product` evoluído, busca, filtros, ordenação, facets. Fundação: validação, erros, testes. |
| 2 | Home consumindo a API | Sem código novo no back. Garante os endpoints de destaque e recentes. |
| 3 | Carrinho | `Cart`, `CartItem`, identificados por `X-Cart-Token`. |
| 4 | Checkout | Validação do checkout sem persistir pedido (proposta). |
| 5 | Pedido | `Order`, `OrderItem`, `Address`; baixa de estoque. |
| 6 | Cupom | `Coupon`, aplicado a um pedido em status `CREATED`. |
| 7 | Pagamento simulado | `Payment`; pedido passa a `PAID`. |

## Fora do escopo

Módulo de avaliações (`Review`; só existem os campos agregados `rating` e `reviewCount` no produto, sem preenchimento por ora); a página de detalhe do produto é só do front e usa `GET /api/product/v1/{id}`; banners, newsletter e contato; frete; status de pedido além de `PAID` (enviado, entregue, cancelado); consulta de pedido por e-mail; comparar produtos; multi-moeda e multi-idioma; upload de imagens; login, usuários e papéis.

## Stack

| Item | Valor | Observação |
|---|---|---|
| Spring Boot | 4.1.1 | já no `pom.xml` |
| Java | 25 | |
| Build | Maven (`./mvnw`) | indentação de 4 espaços nos arquivos de build |
| Banco | MySQL | schema `geek-shopping` |
| Migrations | Flyway | via `spring-boot-starter-flyway` + `flyway-mysql` |
| Persistência | Spring Data JPA / Hibernate 7 | `ddl-auto: none`, `check_nullability: true` |
| Mapeamento | Dozer 7.0.0 | wrapper `DozerMapper` |
| HATEOAS | `spring-boot-starter-hateoas` | |
| Validação | `spring-boot-starter-validation` | |
| Documentação | springdoc 3.1.0 | Swagger UI na raiz |
| Web | `spring-boot-starter-webmvc` | nome modular do Boot 4 |
| Formatos | só JSON | decisão do projeto |

Dependências de teste: `spring-boot-starter-test`, `spring-boot-starter-data-jpa-test`, `testcontainers-mysql` (gerenciado pelo BOM), `rest-assured` 6 (versão em property). Detalhes em [06](06-qualidade-e-testes.md).

## Decisões do projeto

| Tema | Decisão |
|---|---|
| Identificação do carrinho | Header `X-Cart-Token` (UUID gerado no cliente). Nunca na URL. |
| Ordenação do catálogo | `page`, `size`, `direction` + `sortBy` com whitelist. Valor fora da lista → 400. Desvio da skill `pagination`, que fixa o campo por endpoint. |
| Media types | Só JSON. Sem XML, sem YAML, sem JAXB nos testes. |
| Testes | Unitários + `@DataJpaTest` + integração (Testcontainers + REST Assured). Exige Docker. |
| Dinheiro | `BigDecimal` na entidade e no DTO, `decimal(65,2)` no banco. |
| Login | Fora do escopo. Compra como convidado. |
| Migrations | Somente SQL nativo. Nunca migrations em Java nem inner classes. |

## Premissas

- Mensagens de erro e textos do Swagger em **inglês**.
- Injeção por `@Autowired` em campo (padrão da skill `code-organization` e do `CLAUDE.md` do projeto).
- Migrations V1 e V2 já aplicadas **não são editadas**. Correções entram em V3 em diante.
- Pacote `repositories` e mapper `DozerMapper` ficam como estão.

## Consequências de não haver login

- Os endpoints de escrita (produto, categoria, cor, tamanho, cupom) ficam **abertos**. Provisório; registrar isso no Swagger e revisitar com uma proteção mínima (por exemplo, chave de admin) quando o login for decidido.
- `Cart` e `Order` têm `customer_id` nulo. A coluna existe desde a primeira migration para que o login futuro não force refazer as tabelas.
- O pedido é acessado por um **número opaco** (UUID), não pelo id sequencial, para não ser enumerável. Quem tem o número pode ver e pagar o pedido.
- O limite de uso do cupom é global; não existe limite por cliente.
- A skill `authentication` e os testes autenticados (`AuthenticatedIntegrationTest`) não se aplicam.
