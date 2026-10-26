# 03 — Dados e contrato com a API

Contrato do back: [`docs/specs/backend/04-contrato-da-api.md`](../backend/04-contrato-da-api.md) e [`05-modulos.md`](../backend/05-modulos.md). Onde o back marca **proposta** ou deixa algo indefinido, esta spec trata como suposição e registra um pedido ao back no fim.

## Camada de dados

Direção: componente → hook (`use*`) → service (`core/api`) → `httpClient`.

### `httpClient`

- Instância Axios única. Hoje: `baseURL: process.env.NEXT_PUBLIC_API_URL` (`httpClient.ts:26`).
- **Interceptor de request:** injeta `X-Cart-Token` nas rotas de carrinho e de pedido (lê o token do store, ver [04](04-ui-estado-e-design-system.md)). Cancelamentos são repassados.
- **Interceptor de erro:** converte para `ApiError(message, status, fields?)`:
  - `ExceptionResponse` (`{ timestamp, message, details }`): usa `message`.
  - `ProblemDetail` (`application/problem+json`): usa `detail`; em validação (`detail: "Validation failed"`) preenche `fields` com o mapa `errors` (campo → mensagem).
  - Sem resposta (rede): `ApiError('Could not connect…', 0)`.
- Aceitar `200` e `201` em criações (o back propõe 201; hoje devolve 200).

### Services por recurso

| Service | Endpoints |
|---|---|
| `productsService` | `GET /api/product/v1` (filtros), `GET /{id}`, `GET /facets`, `GET /featured`, `GET /recent` |
| `categoriesService` | `GET /api/category/v1` |
| `attributesService` | `GET /api/color/v1`, `GET /api/size/v1` |
| `cartService` | `GET`, `DELETE /api/cart/v1`; `POST`, `PUT /{itemId}`, `DELETE /{itemId}` em `/api/cart/v1/items` |
| `ordersService` | `POST /api/order/v1`, `GET /api/order/v1/{orderNumber}` |
| `couponService` | `POST`, `DELETE /api/order/v1/{orderNumber}/coupon` |
| `paymentService` | `POST /api/order/v1/{orderNumber}/payment` |
| `checkoutService` | `POST /api/checkout/v1/validate` (proposta; pode não existir) |

Os endpoints administrativos (CRUD de produto, categoria, cupom) **não** são consumidos pelo storefront.

### Adaptador HAL

O back devolve `PagedModel` HAL; o app usa um `PageResponse` interno. Um adaptador no service converte, de modo que nenhum componente conhece HAL.

| Resposta do back | Modelo interno |
|---|---|
| `_embedded.<relation>` (`products`) | `content` |
| `page.size`, `page.number`, `page.totalElements`, `page.totalPages` | `size`, `number`, `totalElements`, `totalPages` |
| ausência de `_links.prev` / `_links.next` | `first` / `last` |
| `_embedded` ausente (página vazia) | `content: []`, `empty: true` |

`_links` de cada item são ignorados pelo storefront (as rotas são conhecidas). Listas pequenas (categorias, cores, tamanhos) podem vir como lista simples com links; o adaptador as normaliza em array.

## Modelos (`app/core/models`)

Os nomes JSON seguem [`backend/04`](../backend/04-contrato-da-api.md) (seção "Formato JSON dos DTOs"); abaixo, o modelo-alvo do front.

| Modelo | Campos principais |
|---|---|
| `Product` | `id`, `name`, `description`, `price`, `oldPrice?`, `imageUrl`, `quantity`, `featured`, `createdAt`, `popularity`, `category` (id e nome), `colors[]`, `sizes[]`, **`rating?`, `reviewCount?`** |
| `Category` | `id`, `name`, `imageUrl`, `parentId?`, `productCount?` |
| `Color`, `Size` | `id`, `name` |
| `Cart` / `CartItem` | itens com produto, `quantity`, cor e tamanho escolhidos; subtotal e totais vindos do servidor |
| `Order` | `number`, `status` (`CREATED`/`PAID`), `subtotal`, `discount`, `total`, `createdAt`, `items[]`, `addresses`, `coupon?`, `payment?` |
| `Address` | `type` (`BILLING`/`SHIPPING`), nome, sobrenome, e-mail, celular, linha 1, linha 2, país, cidade, estado, CEP |
| `Coupon` (resposta) | código e desconto aplicado |
| `PaymentMethod` | `PAYPAL`, `DIRECT_CHECK`, `BANK_TRANSFER` |
| `PageResponse<T>` | ver adaptador |

O modelo atual (`app/core/models/product.ts`) tem `category: string`, `color?`, `size?`, `originalPrice?`, `rating?`, `reviewCount?`; o `PageResponse` atual é plano (`pagination.ts:1-10`).

## Parâmetros da listagem

`GET /api/product/v1` aceita `page` (0), `size` (12, máx. 100), `direction` (`asc`/`desc`), `sortBy` (`name`, `price`, `createdAt`, `popularity`, `rating`) e os filtros `q`, `categoryId`, `minPrice`, `maxPrice`, `colorId`, `sizeId` (repetível), `featured`.

Mapeamento dos controles do shop: Latest → `createdAt` desc; Popularity → `popularity` desc; Name A–Z/Z–A → `name`; preço → `price`. Best Rating → `rating` desc (sem nota, vai para o fim).

## Query keys e cache

Fábrica por recurso, arrays simples: `['products', params]`, `['product', id]`, `['facets', params]`, `['categories']`, `['colors']`, `['sizes']`, `['cart']`, `['order', number]`. Mutações invalidam: item de carrinho → `['cart']`; criar pedido → `['cart']` e `['order', number]`; cupom e pagamento → `['order', number]`.

## Erros → UI

| Status | Origem | Tratamento |
|---|---|---|
| 400 validação (`errors{}`) | formulário | mostrar a mensagem no campo |
| 400 regra / cupom inválido | `ExceptionResponse` | mensagem inline na tela |
| 400 header de carrinho ausente | token perdido | regenerar token e recarregar |
| 404 | produto/pedido inexistente | estado "não encontrado" |
| 409 (proposta) | estoque insuficiente, pedido já pago, pedido não `CREATED` | mensagem inline e recarregar os dados |
| 5xx / rede | genérico | estado de erro com tentar novamente |

## Alinhamento com as specs do back

Tabela completa de descompassos em [07](07-alinhamento-do-app-atual.md). Os pedidos que esta spec fez ao back **já foram incorporados** às specs do back (ver "Alinhamento com as specs do front" em [`backend/README.md`](../backend/README.md)):

| Pedido | Onde ficou no back |
|---|---|
| `rating` / `reviewCount` opcionais e `sortBy=rating` | `backend/03`, `04`, `05` |
| `productCount` na categoria | `backend/04` (formato JSON dos DTOs) |
| Payload de `GET /facets` | `backend/04` |
| Nomes JSON de `Product`, `Category`, `Address` e corpos de pedido, cupom e pagamento | `backend/04` |
| `X-Cart-Token` no CORS | `backend/04` (e teste de CORS) |

Ainda são **propostas** do back, e o front deve funcionar nas duas formas: `201` no create (aceitar 200 e 201), `ConflictException` / `409` (tratar 409 se vier; senão cair no 400) e `POST /api/checkout/v1/validate` (se não existir, o front valida só localmente).

Enquanto `rating` vier nulo, o card omite o bloco de estrelas (ver [05](05-telas-e-modulos.md)).
