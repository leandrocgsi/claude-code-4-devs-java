# 07 — Alinhamento do app atual

Comparação do `geek-shopping-app` com (A) as skills `erudio-frontend` e (B) o contrato do back (`docs/specs/backend/`). Linhas conferidas no código; onde não há linha, o fato vem da auditoria e do `CLAUDE.md`/`ARCHITECTURE.md` do app. "Entrega" é a do macroplano.

## A. App × skills `erudio-frontend`

### Em conformidade

Stack e versões (next ^16, react ^19, TanStack Query ^5, zustand ^5, axios ^1, tailwind ^4, vitest ^4); ESLint flat config; alias `@/*`; estrutura de pastas; padrão `Name.tsx` + `module.css` + `index.ts`; páginas finas; hooks facade com seletores; `QueryClient` com os defaults da skill (`providers.tsx`); testes em `__test__/`; gate manual (`tsc`, lint, build, vitest); identificadores em inglês.

### Divergências

| # | Skill | App | Ação | Entrega |
|---|---|---|---|---|
| A1 | Mocks colocados (`<Feature>.mocks.ts`) e só enquanto não há backend | Mocks globais em `app/core/mocks/` e flag fixa `USE_MOCK_PRODUCT_DATA = true` (`products.ts:14`, branch em `:40`) | Remover mocks e flag (decisão do macroplano); dados de teste ficam no MSW | 2 |
| A2 | `baseURL` com `/api/v1` e rewrite de `/api/v1/:path*` | Rewrite `/api/:path*` (`next.config.ts:20-27`) e caminhos `/api/product/v1` (`products.ts:12`) | Exceção justificada: o contrato é `/api/<recurso>/v1`. Documentar. | 2 |
| A3 | Um único caminho para a API | Rewrite **e** `baseURL` direto (`httpClient.ts:26`) | Escolher um (ver [02](02-arquitetura-e-convencoes.md)) | 2 |
| A4 | `ApiError` a partir do corpo de erro | Interceptor normaliza o erro em `ApiError(message, status)` | Estender para `ExceptionResponse`, `ProblemDetail` e `errors{}` | 2 |
| A5 | `dev`/`start` com `-p <PORT>` | `-p 3000` fixo (`package.json:6,8`); `PORT` em `.env.example` não é lida | Ler `PORT` ou remover a variável | 2 |
| A6 | Silenciosa sobre `persist` | Nenhum store persiste; wishlist usa `Set` (`useWishlistStore.ts:10`) | `persist` para token, último pedido e wishlist; wishlist como array | 3 |
| A7 | Cobertura exclui `core/api` e `store` | Idem (`vitest.config.ts:21-22`); o `ARCHITECTURE.md:184` ainda cita `app/core/mocks`, que **não** está excluído em `vitest.config.ts:16-26` | Remover as exclusões de `core/api` e `store` quando houver MSW; corrigir o doc | 2 |
| A8 | Tokens placeholder + `lucide-react` no modo genérico | `react-icons/fa` e tokens do MultiShop (Port mode) | Aceito (Port mode) | — |
| A9 | Docs descrevem o projeto | `ARCHITECTURE.md` trata `Carousel` como "novo" (`:161`) e lista `ProductCard`/`ShopSidebar` na tabela do design system (`:162-163`), mas são de feature | Corrigir | 2 |
| A10 | Testes de componente e dados | Um único teste (`Button`); sem MSW, sem E2E, sem CI | [06](06-qualidade-e-testes.md) | 2 em diante |
| A11 | Lacuna das skills: query keys, `persist`, testes de dados | Sem convenção | Fixadas em [03](03-dados-e-contrato-com-a-api.md) e [04](04-ui-estado-e-design-system.md) | 2 |

## B. App × contrato do back

Back: [`backend/04-contrato-da-api.md`](../backend/04-contrato-da-api.md) (já alinhado ao front).

| # | O app espera | O back entrega | Ação | Entrega |
|---|---|---|---|---|
| B1 | `PageResponse` plano: `content`, `totalPages`, `number`, `first`, `last` (`models/pagination.ts:1-10`) | `PagedModel` HAL: `_embedded.products`, `page{…}`, `_links` | Adaptador HAL em `core/api`; `first`/`last` derivados de `_links` | 2 |
| B2 | `page`, `size`, `direction` (`products.ts:44`); só ordenação por nome | + `sortBy` (`name`, `price`, `createdAt`, `popularity`, `rating`); `size` ≤ 100; 400 fora da lista | Mapear Latest, Popularity, Best Rating, nome, preço | 2 |
| B3 | Filtros de busca, preço, cor e tamanho **no cliente**, só sobre a página atual (`Products.tsx:52-65`); contagens da sidebar sobre o mock (`mocks/products.ts:136`, `PRICE_BUCKETS`) | Filtros no servidor (`q`, `categoryId`, `minPrice`, `maxPrice`, `colorId`, `sizeId`, `featured`) e `GET /facets` | Filtros na URL; contagens dos facets; remover `PRICE_BUCKETS` | 2 |
| B4 | `Product.category: string`; `color?`/`size?` strings; `originalPrice?` | `category {id,name}`; `colors[]`/`sizes[]`; `oldPrice`; extras `featured`, `createdAt`, `popularity` | Atualizar o modelo e os usos (card, sidebar, quick view) | 2 |
| B5 | `rating?` e `reviewCount?` opcionais | `rating` (nulo) e `reviewCount` (0) somente leitura | Manter; `RatingStars` omite sem `rating` | 2 |
| B6 | Categorias derivadas do mock (`categories.ts:16`); menu com lista fixa de moda (`categories.ts:30`, `Header.tsx:123`) | `GET /api/category/v1` hierárquico com `productCount` | `categoriesService`; grade da Home e menu do Header com dados reais | 2 |
| B7 | Carrinho `{productId: qty}` no Zustand, pré-semeado (`useCartStore.ts:11`); produto resolvido por `findMockProduct` (`useCart.ts:22`) | Carrinho no servidor com `X-Cart-Token`; item = produto + cor + tamanho; subtotal no servidor | Carrinho via Query; remover o mock e o pré-semeio | 3 |
| B8 | Frete fixo de 10 (`useCart.ts:11,30`) | Sem frete; `total = subtotal − discount` | Remover a linha de frete | 3 |
| B9 | Cupom no carrinho, sempre "not available" (`Cart.tsx:15-16,100-106`) | Cupom só no **pedido** | Remover do carrinho; criar na tela do pedido | 6 |
| B10 | Checkout sem API; "Place Order" só limpa o carrinho (`Checkout.tsx:29,35`); campos não controlados; país `br/us/ca/gb`; pagamento `paypal`/`direct-check`/`bank-transfer` | `POST /api/order/v1` com `billingAddress` e `shippingAddress?`; `Address` em camelCase; método em `PAYPAL`/`DIRECT_CHECK`/`BANK_TRANSFER` | Formulário controlado; mapa de enums; erros por campo; país conforme o back aceitar | 4, 5 |
| B11 | Checkbox "Create an account" | Sem login | Remover | 4 |
| B12 | Não existe tela de pedido | `GET /api/order/v1/{orderNumber}` | Rota `/orders/[number]`; persistir `orderNumber` | 5 |
| B13 | Não existe tela de detalhe | `GET /api/product/v1/{id}` | Rota `/products/[id]` | 2 |
| B14 | Imagens locais `/assets/multishop/product-N.jpg` | `imageUrl` do seed em `example.com` | `images.remotePatterns` ou imagens reais (ponto em aberto) | 2 |
| B15 | `PRICE_BUCKETS` rotulados em `$` e UI em BRL | Faixas vêm dos facets | Rotular em BRL | 2 |
| B16 | Erros só com `message` | `ExceptionResponse` e `ProblemDetail`; 409 proposto | [03](03-dados-e-contrato-com-a-api.md) | 2 |
| B17 | `X-Cart-Token` inexistente | Header de carrinho/pedido; CORS o aceita | Interceptor injeta o token | 3 |
| B18 | — | Produto sem estoque aparece mas não vai ao carrinho; carrinho pode expirar; create pode devolver 200 ou 201 | Botão desabilitado; carrinho expirado = vazio; aceitar 200 e 201 | 2, 3 |

## Ordem sugerida na entrega 2

1. Remover mocks e a flag (A1, A3) com o `httpClient` e o adaptador HAL (B1, A4).
2. Modelos novos (B4, B5), `productsService` e filtros na URL (B2, B3, B15).
3. Categorias e Header (B6), Home, shop e detalhe (B13), imagens (B14).
4. MSW e testes de componente (A7, A10).

As entregas seguintes (carrinho, checkout, pedido, cupom, pagamento) tratam B7–B12 e B17.
