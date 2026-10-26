# 04 — Contrato da API

Fonte: skills `pagination`, `hateoas`, `exception-handling`, `bean-validation`, `swagger`, `swagger-advanced`, `web-config`. Contrato em alto nível; payloads exatos ficam no plano micro e no Swagger.

## Convenções gerais

- Base: `/api/<recurso>/v1`, recurso no singular. Só JSON (`produces`/`consumes` = `application/json` em todo endpoint, inclusive `DELETE`).
- Datas em ISO-8601. Dinheiro como número decimal com 2 casas.
- Sem autenticação: nenhum endpoint exige token. Endpoints de escrita estão abertos (provisório).
- Header do carrinho: `X-Cart-Token` (UUID). Ausente ou inválido em rota de carrinho → 400.
- Pedido é identificado na rota pelo **número** (`{orderNumber}`, UUID), não pelo id.

## Rotas por recurso

| Recurso | Rota | Verbos |
|---|---|---|
| Produto | `/api/product/v1` | `GET` (paginado, com filtros), `GET /{id}`, `POST`, `PUT`, `DELETE /{id}`, `GET /facets`, `GET /featured`, `GET /recent` |
| Categoria | `/api/category/v1` | `GET` (árvore ou lista), `GET /{id}`, `POST`, `PUT`, `DELETE /{id}` |
| Cor / Tamanho | `/api/color/v1`, `/api/size/v1` | `GET`, `POST` |
| Carrinho | `/api/cart/v1` | `GET`, `DELETE` (esvaziar) |
| Itens do carrinho | `/api/cart/v1/items` | `POST`, `PUT /{itemId}`, `DELETE /{itemId}` |
| Checkout (proposta) | `/api/checkout/v1/validate` | `POST` |
| Pedido | `/api/order/v1` | `POST`, `GET /{orderNumber}` |
| Cupom no pedido | `/api/order/v1/{orderNumber}/coupon` | `POST`, `DELETE` |
| Pagamento | `/api/order/v1/{orderNumber}/payment` | `POST` |
| Cupom (administração) | `/api/coupon/v1` | `GET`, `POST`, `PUT`, `DELETE /{id}` |

Todas as listagens de coleção grande são paginadas. Listas pequenas e estáveis (cores, tamanhos, categorias) podem devolver lista simples com links.

## Paginação e ordenação

- Query params: `page` (padrão `0`), `size` (padrão `12`, teto de **100**), `direction` (`asc` | `desc`, padrão `asc`) e `sortBy`.
- `sortBy` com whitelist: `name`, `price`, `createdAt`, `popularity`, `rating`. Padrão `name`. Em `rating`, produtos sem nota (nulos) vão para o fim em qualquer direção. Valor fora da lista → `400`. Em empate, desempate por `id`.
- Resposta: `PagedModel<EntityModel<XDTO>>` montado no service com `PagedResourcesAssembler`. Itens ficam em `_embedded.<collectionRelation>` (por exemplo, `products`). Metadados em `page.size|number|totalElements|totalPages`. Links `self`, `first`, `prev`, `next`, `last` (`prev` ausente na primeira página, `next` ausente na última).
- `page` e `size` negativos ou `size` acima do teto → `400`.
- Desvio da skill `pagination`: a skill fixa o campo de ordenação por endpoint; aqui `sortBy` é parâmetro porque o shop ordena por critérios diferentes sobre os mesmos filtros.

## Filtros do catálogo

`GET /api/product/v1` aceita, combinados com E lógico:

| Parâmetro | Significado |
|---|---|
| `q` | busca textual no nome e na descrição (case-insensitive) |
| `categoryId` | categoria (inclui subcategorias) |
| `minPrice`, `maxPrice` | faixa de preço |
| `colorId`, `sizeId` | atributo (aceita repetição para "ou") |
| `featured` | somente destaques |

`GET /api/product/v1/facets` devolve, para o conjunto filtrado, as contagens por faixa de preço, cor, tamanho e categoria (alimenta a sidebar do shop). `featured` e `recent` são atalhos paginados para as seções da Home.

## Formato JSON dos DTOs

Nomes em `camelCase`. Definidos aqui para que o front e o back concordem; campos extras de `_links` seguem o HAL.

| DTO | Campos |
|---|---|
| `Product` | `id`, `name`, `description`, `price`, `oldPrice` (nulo), `imageUrl`, `quantity`, `featured`, `createdAt`, `popularity`, `rating` (nulo), `reviewCount`, `category` (`{ id, name }`), `colors` (`[{ id, name }]`), `sizes` (`[{ id, name }]`) |
| `Category` | `id`, `name`, `imageUrl`, `parentId` (nulo), `productCount` (derivado, nunca persistido) |
| `Color`, `Size` | `id`, `name` |
| `Address` | `type` (`BILLING`/`SHIPPING`), `firstName`, `lastName`, `email`, `mobile`, `addressLine1`, `addressLine2` (nulo), `country`, `city`, `state`, `zipCode` |

`POST /api/order/v1` recebe `{ "billingAddress": Address, "shippingAddress": Address | ausente }`; o `type` é definido pelo servidor. `POST .../payment` recebe `{ "method": "PAYPAL" | "DIRECT_CHECK" | "BANK_TRANSFER" }` e `POST .../coupon` recebe `{ "code": "..." }`.

### `GET /api/product/v1/facets`

Aceita os mesmos filtros da listagem (menos paginação e ordenação) e conta sobre o conjunto filtrado:

```json
{
  "priceRanges": [{ "min": 0, "max": 100, "count": 12 }],
  "colors": [{ "id": 1, "name": "Black", "count": 5 }],
  "sizes": [{ "id": 1, "name": "M", "count": 7 }],
  "categories": [{ "id": 1, "name": "Action Figures", "count": 4 }]
}
```

As faixas de preço são fixas de 100 em 100, com a última aberta (`max` nulo). O detalhe fica para o plano micro.

## Status HTTP

| Operação | Sucesso | Erros |
|---|---|---|
| `GET` item | 200 | 404 |
| `GET` lista/página | 200 | 400 (parâmetros) |
| `POST` cria recurso | **201** (proposta; hoje o código devolve 200) | 400 (validação/regra) |
| `PUT` | 200 | 400, 404 |
| `DELETE` | 204 | 404, 409 se há referência de pedido |
| Criar pedido | 201 | 400 (carrinho vazio, endereço inválido), 409 (estoque insuficiente) |
| Aplicar/remover cupom | 200 | 400 (cupom inválido), 404, 409 (pedido não está `CREATED`) |
| Pagar | 200 | 404, 409 (pedido já pago) |

`409` depende da `ConflictException` proposta (ponto em aberto no README). O Swagger documenta o status real devolvido.

## Erros

Dois formatos, como na skill `exception-handling`:

| Formato | Quando | Corpo |
|---|---|---|
| `ExceptionResponse` | erros de domínio e catch-all | `{ timestamp, message, details }` |
| `ProblemDetail` (`application/problem+json`) | erros do framework e de validação | `type: "about:blank"`, `title`, `status`, `detail`, `instance`; na validação, `detail: "Validation failed"` e `errors` (mapa campo → mensagem) |

Regras:

- Exceções de domínio: `ResourceNotFoundException` (404), `RequiredObjectIsNullException` (400), `BadRequestException` (400), `ConflictException` (409, proposta). Todas com `@ResponseStatus` e `serialVersionUID`.
- O handler estende `ResponseEntityExceptionHandler`, tem um `@ExceptionHandler` por exceção, sobrescreve `createResponseEntity` (repõe `type = about:blank`) e os dois hooks de validação (`handleMethodArgumentNotValid`, `handleHandlerMethodValidationException`).
- O catch-all devolve 500 com mensagem genérica; **não** vaza `ex.getMessage()`.

## Validação

- `@Valid` em todo `@RequestBody`; `@Min`/`@Max` direto em `@RequestParam`/`@PathVariable`.
- **Armadilha:** `@Valid` e constraints de parâmetro ficam **só na interface `*ControllerDocs`**. Repeti-los na classe do controller causa 500 (`HV000151`) no controller inteiro.
- Constraints em DTOs de entrada: `@NotBlank`, `@NotNull`, `@Size(max)` igual ao `varchar`, `@Positive`, `@Email`, `@Pattern`.
- Regras que dependem de dados (estoque, cupom, estado do pedido) ficam no service.
- Mensagens em inglês; sem `message` explícito nas constraints.

## CORS

`WebConfig`: origens vindas de `cors.originPatterns` (inclui `http://localhost:3000`), `allowedMethods("*")`, `allowCredentials(true)`. Origem fora da lista → `403 Invalid CORS request`. O header `X-Cart-Token` precisa estar nos headers permitidos: o `addMapping("/**")` do Spring já permite todos os headers por padrão (`allowedHeaders` = `*`), e isso deve ser coberto pelo teste de CORS (requisição com `X-Cart-Token` a partir de `http://localhost:3000`).

## Swagger

- springdoc 3.1.0; UI na raiz; `paths-to-match: /api/**/v1/**`.
- Anotações `@Operation`, `@ApiResponse`, `@Parameter` nas interfaces `*ControllerDocs`; `@Tag` uma vez, na classe do controller; controller com `@Override` e sem anotações Swagger nos métodos.
- Anotações compostas em `controllers/docs/annotations/` (`ApiNotFoundResponse`, `ApiBadRequestResponse`, `ApiValidationResponse`, `ApiConflictResponse`, `ApiInternalServerErrorResponse`, `ApiPageableParameters`).
- Corpos de erro documentados com exemplos reais de `ExceptionResponse` e `ProblemDetail`.
- Sem 403 (não há autenticação). Documentar que escrita está aberta.
- `summary`/`description` em inglês; `tags` em inglês.

## HATEOAS

- DTOs estendem `RepresentationModel` com `@Relation`. Links só no service, em `addHateoasLinks`.
- Todo link com `.withRel(...)` e `.withType("GET|POST|PUT|DELETE")`; o próprio com `.withSelfRel()`.
- JSON em formato HAL (`_links` como mapa). Rels típicos: `findAll`, `create`, `update`, `delete`; no pedido, `coupon`, `payment`.
