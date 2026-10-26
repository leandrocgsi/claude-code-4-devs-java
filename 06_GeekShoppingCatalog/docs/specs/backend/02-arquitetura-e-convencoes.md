# 02 — Arquitetura e convenções

Fonte: skills `code-organization`, `code-style`, `spring-data-jpa`, `hateoas`, `pagination`, `bean-validation`, `exception-handling`, `swagger`, `web-config`. Esta spec resume o que vale para o projeto e marca onde ele estende as skills.

## Camadas e pacotes

Flat-by-layer sob `br.com.erudio`.

| Pacote | Conteúdo |
|---|---|
| (raiz) | `Startup` (`@SpringBootApplication`) |
| `config` | `OpenApiConfig`, `WebConfig` |
| `controllers` | `*Controller` |
| `controllers/docs` | `*ControllerDocs` (interfaces com as anotações do Swagger) |
| `controllers/docs/annotations` | anotações compostas do Swagger (`swagger-advanced`) |
| `services` | `*Service` |
| `repositories` | `*Repository` (mantido no plural) |
| `model` | entidades JPA e enums |
| `data/dto` | `*DTO` (e `data/dto/request` para corpos de entrada que não espelham a entidade) |
| `mapper` | `DozerMapper` |
| `exception` | exceções de domínio e `ExceptionResponse` |
| `exception/handler` | `CustomEntityResponseHandler` |

Não há `SecurityConfig`, `security/` nem `JacksonConfig` (sem login, só JSON).

## Nomes

`*DTO`, `*Controller`, `*ControllerDocs`, `*Service`, `*Repository`, `*Exception`. Tabelas em `lower_snake_case`, no plural (`products`, `cart_items`, `orders`). Evitar palavras reservadas do MySQL. Rotas no singular: `/api/<recurso>/v1`.

## Estilo de código

- **Sem Lombok, ever.** Construtores, getters, setters, `equals` e `hashCode` explícitos.
- **Sem comentários** e sem Javadoc.
- 4 espaços, sem tabs, inclusive em `pom.xml`.
- `var` quando o tipo é óbvio pelo lado direito; tipo explícito quando a variável é declarada antes de um `if`.
- Guard clause em uma linha, sem chaves: `if (x == null) throw new RequiredObjectIsNullException();`.
- Condições booleanas longas quebradas, com `&&` e `||` no fim da linha.
- `equals`/`hashCode` sobre todos os campos, via getters, com `Objects`.
- Anotações com vários argumentos: um por linha.
- Logger SLF4J: `private static final Logger logger = LoggerFactory.getLogger(X.class)`.
- `ExceptionResponse` é `record`. Entidades e DTOs são classes com construtor sem argumentos.
- Injeção por `@Autowired` em campo.

## Entidade, DTO, controller, service

- **Entidade:** `implements Serializable` com `serialVersionUID`; `@Table`; `@Id` + `@GeneratedValue(IDENTITY)` com `Long`; `@Column(name, nullable, length)` em todo campo; datas em `LocalDate`, `LocalDateTime` ou `Instant`; enums com `@Enumerated(EnumType.STRING)`; relacionamentos `LAZY` por padrão (com `open-in-view: false`, use `JOIN FETCH`, `@EntityGraph` ou `@Transactional` no service).
- **DTO:** classe que estende `RepresentationModel<XDTO>`, com `@Relation(collectionRelation = "...")`, sem anotações JPA. Constraints do Bean Validation nos DTOs de entrada. O controller nunca expõe entidade.
- **Controller:** só delega ao service. Retorna DTO, `ResponseEntity` quando precisa controlar o status, `PagedModel<EntityModel<XDTO>>` em listagens.
- **Service:** converte com `DozerMapper`, aplica regras de negócio, monta links HATEOAS (**só no service**, método privado `addHateoasLinks`) e o `PagedModel` (método privado `buildPagedModel`). Lança exceções de domínio.
- **Repository:** `extends JpaRepository<E, Long>`; JPQL com `@Query` e `@Param`; busca textual case-insensitive com `LOWER(col) LIKE LOWER(CONCAT('%', :x, '%'))`; `@Modifying(clearAutomatically = true)` com `@Transactional` no service.
- **Update:** carrega a entidade gerenciada, copia campo a campo e chama `save`.

## Dinheiro e tempo

- Dinheiro: `BigDecimal` com `scale = 2` e arredondamento `HALF_UP`; coluna `decimal(65,2)`. Nunca `Double`.
- Instante de criação: `LocalDateTime` (coluna `datetime(6)`). O `ExceptionResponse` mantém `Date` hoje; migrar para `Instant` é opcional.

## Configuração (`application.yml`)

Arquivo único `application.yml` (nunca `.yaml`). Chaves:

- `spring.datasource.url|username|password` com `${DB_URL:...}`, `${DB_USER:root}`, `${DB_PASSWORD:...}`: sem segredo em texto puro no repositório.
- `spring.jpa.hibernate.ddl-auto: none`, `spring.jpa.open-in-view: false`, `check_nullability: true`.
- `cors.originPatterns` (já inclui `:3000` e `:8080`).
- `springdoc` (`paths-to-match: /api/**/v1/**`, UI na raiz).

Perfis `dev`/`prod` não são exigidos pelas skills; ficam como melhoria futura (baixa prioridade). O `application.yml` de teste é uma cópia completa do principal sem `datasource.url|username|password`, com `server.port: 8888` (ver [06](06-qualidade-e-testes.md)).

## Transações e concorrência

- Operações que alteram mais de uma tabela (criar pedido, aplicar cupom, pagar) são **`@Transactional` no service**.
- Baixa de estoque por **update condicional**: `UPDATE products SET quantity = quantity - :q WHERE id = :id AND quantity >= :q`. Zero linhas afetadas = estoque insuficiente. Evita race condition sem lock pessimista.
- Cupom: incremento de `used_count` também condicional (`WHERE used_count < max_uses`).

## Mapeamento Entidade ↔ DTO

Dozer, via `DozerMapper.parseObject(...)` e `parseListObjects(...)`. Campos derivados (totais do carrinho, total do pedido) são calculados no service e preenchidos no DTO, nunca persistidos no carrinho.

## Regras gerais

- Migrations Flyway são **sempre SQL nativo** (`.sql`); nunca migrations em Java nem inner classes (ver [03](03-modelo-de-dados-e-migracoes.md)).
- Erro de input do cliente é 4xx, nunca 500.
- Regra de negócio que depende de dados (estoque, cupom, estado) fica no service e lança exceção de domínio.
- Controller nunca monta links nem faz regra.
- Nenhum endpoint devolve entidade JPA.
