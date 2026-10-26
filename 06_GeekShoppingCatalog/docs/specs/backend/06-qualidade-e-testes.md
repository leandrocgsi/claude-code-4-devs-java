# 06 — Qualidade e testes

Fonte: skills `testing`, `integration-testing`, `pagination`, `hateoas`, `spring-data-jpa`, `maven-config`. Decisão do projeto: unitários + integração, **só JSON**, **sem login**. Integração exige Docker.

## Pirâmide

| Camada | Ferramenta | O que cobre |
|---|---|---|
| Unitário | JUnit 6 + Mockito, sem Spring | Services: regras de negócio, exceções, links HATEOAS, `PagedResourcesAssembler` mockado |
| Repository | `@DataJpaTest` + Testcontainers MySQL | Só `@Query` customizado (filtros, facets, updates condicionais) |
| Integração | `@SpringBootTest` (porta 8888) + Testcontainers + REST Assured 6 | Fluxos de ponta a ponta por controller, CORS, Swagger, paginação, validação |

Banco de teste é sempre o mesmo de produção (MySQL em container), nunca H2. As migrations rodam no container e funcionam como dados de teste.

## O que não se testa por unidade

Controllers (sem `@WebMvcTest`/MockMvc), o exception handler e métodos padrão do Spring Data. Esses são cobertos pela integração.

## Estrutura de `src/test/java/br/com/erudio/`

```
unittests/
  services/            *ServiceTest (um por service)
  mapper/              DozerMapperTest
  mapper/mocks/        MockProduct, MockCategory, MockCart, MockOrder, ...
repository/            *RepositoryTest (@DataJpaTest)
integrationtests/
  testcontainers/      AbstractIntegrationTest
  dto/                 espelhos dos DTOs usados pelos testes
    wrappers/json/     Wrapper*DTO e *EmbeddedDTO (paginação HAL)
  controllers/withjson/  *ControllerJsonTest
  controllers/cors/    CorsTest
  swagger/             SwaggerIntegrationTest
config/                TestConfigs (SERVER_PORT = 8888, origens, nome do header)
```

Não existem `AuthenticatedIntegrationTest`, `withxml`, `withyaml` nem `security`: não há login nem outros formatos.

## Convenções

- **Unitário:** `@ExtendWith(MockitoExtension.class)`, `@InjectMocks` no service, `@Mock` no repository, sem `openMocks`. Cada service cobre os caminhos feliz, `ResourceNotFoundException` e input nulo, com `verify(repository, times(1))`. Builders `Mock*` com valores previsíveis (`"Some Name" + n`). Cuidado com `UnnecessaryStubbingException`.
- **Paginação (unitário):** `@Mock PagedResourcesAssembler` e stub de `assembler.toModel(any(Page.class), any(Link.class))`.
- **HATEOAS:** `assertTrue(links.stream().anyMatch(rel + href.endsWith + type))`. Nunca `assertNotNull(anyMatch)`.
- **Integração:** `AbstractIntegrationTest` sobe o container **uma vez por JVM** e injeta `spring.datasource.*` via `MapPropertySource`. Imagem com tag fixa (por exemplo, `mysql:9.1.0`), nunca `latest`.
- **Fluxos CRUD:** `@TestMethodOrder(OrderAnnotation)` com `@Order`, compartilhando estado em campos estáticos; rodar a classe inteira, nunca um método avulso. Estilo REST Assured: um método por linha, na ordem `given`, `when`, `then`, `extract`.
- **Não usar** `@MockitoBean` nem properties por classe: quebram o cache de contexto.
- **Asserts de paginação:** `page.size|number|totalElements|totalPages` e `_links` (`self`, `first`, `prev`, `next`, `last`); `prev` ausente na primeira página e `next` na última. Requisição canônica: página 3, tamanho 12 (com seed que a comporte).
- **CORS:** origem permitida → 200; fora da lista → 403 com `Invalid CORS request`.
- **Swagger:** `GET /swagger-ui/index.html` → 200 com "Swagger UI" no corpo.

## Cobertura mínima por módulo

| Módulo | Unitário | Repository | Integração |
|---|---|---|---|
| Catálogo | regras de preço, categoria, `sortBy` inválido | filtros, facets, contagem por categoria | CRUD, listagem filtrada/paginada/ordenada, validação 400 |
| Carrinho | soma de itens, limite de estoque, subtotal | — | adicionar/alterar/remover, header ausente, produto sem estoque |
| Checkout | validação de endereço | — | `validate` com sucesso e com erros por campo |
| Pedido | transação de criação, estoque insuficiente | update condicional de estoque | pedido a partir do carrinho, 409 por estoque, consulta por número |
| Cupom | todas as regras de validade e desconto | update condicional de `used_count` | aplicar/remover, cupom inválido, pedido não `CREATED` |
| Pagamento | transição `CREATED → PAID`, pedido já pago | — | pagar, pagar de novo (409), cupom expirado no pagamento |

## Dependências e plugins

- Dependências: `spring-boot-starter-test`, `spring-boot-starter-data-jpa-test`, `testcontainers-mysql` (BOM, sem versão), `rest-assured` (versão em property, fora do BOM).
- `maven-dependency-plugin` (goal `properties`) + `maven-surefire-plugin` com `argLine`: `-javaagent:${org.mockito:mockito-core:jar} --enable-native-access=ALL-UNNAMED`.
- `application.yml` de teste em `src/test/resources`: cópia completa do principal, sem `datasource.url|username|password`, com `server.port: 8888`.
- Comandos: `./mvnw clean package` (roda tudo, exige Docker; nunca `install`), `./mvnw test -Dtest=Classe`. Sem Failsafe nem sufixo `*IT`.
- Sem Docker o contexto falha com `IllegalStateException: Failed to load ApplicationContext`. Isso nunca deve virar "skip" no CI.

## Critério de pronto por entrega

1. Migrations aplicam do zero em um MySQL limpo e sobre o estado anterior.
2. Testes unitários, de repository e de integração do módulo passam (`./mvnw clean package`).
3. Swagger reflete os status e corpos reais, sem 403.
4. Nenhum 500 por input do cliente.
5. Spec e plano micro do módulo atualizados com o que mudou.
