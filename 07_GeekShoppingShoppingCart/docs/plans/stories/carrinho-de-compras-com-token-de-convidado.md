# Carrinho de compras com token de convidado

> Slug: `carrinho-de-compras-com-token-de-convidado` · Criada em: 26/10/2026 23:02 · Origem: macroplano (entrega 3, M3), specs e pedido do usuário

✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica

| Estado | Etapa | Skill | Data |
|---|---|---|---|
| ✅ | Planejamento | /erudio:implement-story | 26/10/2026 23:03 |
| ✅ | Plano aprovado | /erudio:implement-story | 26/10/2026 23:05 |
| ✅ | Implementação do Backend | /erudio:dev-backend | 26/10/2026 23:10 |
| ✅ | Implementação do Frontend | /erudio:dev-frontend | 26/10/2026 23:21 |
| ✅ | Implementação dos testes de Backend | /erudio:dev-unit-tests | 26/10/2026 23:28 |
| ✅ | Implementação dos testes de Frontend | /erudio:dev-ui-tests | 26/10/2026 23:33 |
| ✅ | Implementação dos testes de Integração | /erudio:dev-integration-tests | 26/10/2026 23:41 |
| ✅ | Agente de Code Review | /erudio:agent-code-review | 26/10/2026 23:47 |
| ✅ | Agente de Review de Performance | /erudio:agent-perf-review | 26/10/2026 23:52 |
| ✅ | Agente de Review de Segurança | /erudio:agent-security-review | 26/10/2026 23:56 |
| ✅ | Plano Implementado | /erudio:complete-story | 27/10/2026 00:03 |

## Contexto

O catálogo está fechado (história `catalogo-de-produtos-com-upload-de-imagem`): a API de produtos, a Home, `/products`, `/products/[id]` e `/admin/products` funcionam sobre a API real. O carrinho, porém, ainda é local: `useCartStore` (Zustand) guarda `{ productId: quantidade }` na memória, `useCart` busca cada produto na API para montar as linhas e soma um **frete fixo de 10**; ao recarregar a página, o carrinho se perde.

Esta história é a **entrega 3** do macroplano (M3): o carrinho passa a viver no servidor, identificado por um **token de convidado** (UUID gerado no navegador e enviado no header `X-Cart-Token`), sem login. Cobre a API do carrinho (consultar, adicionar, alterar quantidade, remover item, esvaziar), as regras de estoque e de preço, a limpeza de carrinhos abandonados e a troca do carrinho local pela API no front: adicionar pela listagem e pelo detalhe, contador no Header e tela `/cart`.

Depende do catálogo (produto, estoque, preço, cor e tamanho). As entregas seguintes (checkout, pedido, cupom, pagamento) dependem desta. O **frete** não entra: vira uma história própria, ainda pendente (`docs/plans/stories/frete-do-carrinho.md`).

Aproveita o que já existe: `Product`, `ProductRepository`, `ProductService`, `DozerMapper`, o handler de exceções e a base de testes no back; `useAddToCart`, `useCart`, `useCartCount`, `useCartStore`, `Cart`, `ProductCard`, `ProductDetails`, `ProductDetail`, `Header` e `httpClient` no front.

### Decisões tomadas

| # | Decisão | Origem |
|---|---|---|
| D-1 | A história cobre o carrinho e os pontos de entrada para adicionar: listagem (`ProductCard`), detalhe do produto e contador do Header | usuário, 26/10/2026 |
| D-2 | O frete fica fora; uma história `frete-do-carrinho` é criada e fica pendente. Nesta história `total = subtotal` e o frete fixo de 10 sai do front | usuário, 26/10/2026 |
| D-3 | Carrinhos abandonados são limpos; a inatividade vale **1 dia** e o valor é parametrizado (configuração, não constante no código) | usuário, 26/10/2026 |
| D-4 | O item do carrinho guarda cor e tamanho (texto) **e** a resposta os exibe; como o produto tem um único valor de cada, o item assume os do produto | usuário, 26/10/2026 ("1 e 2") |
| D-5 | O cupom é uma história à parte (entrega 6); não aparece no carrinho | usuário, 26/10/2026; `macroplano` M4 |
| D-6 | As regras propostas a partir de `backend/04` e `05` valem sem ajustes adicionais | usuário, 26/10/2026 |
| D-7 | Sem login: o token é a única credencial; `customer_id` fica nulo e sem FK | `macroplano` (Decisões) |

## Escopo

### Inclui

- Back: tabelas `carts` e `cart_items`; API `/api/cart/v1` (`GET`, `DELETE`) e `/api/cart/v1/items` (`POST`, `PUT /{itemId}`, `DELETE /{itemId}`) com `X-Cart-Token`; regras de quantidade, estoque verificado, soma de itens repetidos, preço e subtotal calculados no servidor; limpeza agendada de carrinhos abandonados, com o prazo configurável; `X-Cart-Token` aceito pelo CORS.
- Front: token do carrinho persistido; interceptor que injeta o header; carrinho via TanStack Query (`['cart']`); adicionar pela listagem e pelo detalhe; contador do Header derivado da API; tela `/cart` com itens, quantidade, remover, esvaziar, subtotal e total; remoção do frete fixo e do carrinho local (Zustand).
- Alinhamentos de `07-alinhamento-*` que a história precisa tocar: front B7, B8, B17 e B18 (o que cabe a esta entrega).
- Criar o esqueleto da história `frete-do-carrinho`, pendente.

### Fora do escopo

Frete (história `frete-do-carrinho`); cupom (entrega 6, só no pedido); checkout, pedido e pagamento (entregas 4, 5 e 7); o botão "Proceed to Checkout" continua levando a `/checkout`, que segue demo; login, `customer_id` com FK e mescla do carrinho anônimo no login; reserva de estoque (o estoque é verificado, não reservado); variantes de produto com estoque por cor e tamanho; tabelas `colors` e `sizes`; wishlist no servidor; proteção dos endpoints (continuam abertos); itens de estoque baixado (acontece no pedido).

## Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RN-1 | Toda rota do carrinho exige o header `X-Cart-Token` com um UUID válido; ausente ou inválido devolve 400 | `backend/04` (Convenções gerais) |
| RN-2 | O carrinho é criado sob demanda na primeira escrita para o token; `GET` de um token sem carrinho devolve 200 com um carrinho vazio e não grava nada | `backend/05` (Carrinho); `frontend/05` (Entrega 3, estados) |
| RN-3 | Quantidade do item `≥ 1` e `≤` estoque do produto (`quantity`); o estoque é verificado, não reservado; produto sem estoque não pode ser adicionado | `backend/05` (Carrinho, Catálogo) |
| RN-4 | Adicionar um item com a mesma combinação `produto + cor + tamanho` soma a quantidade ao item existente; a soma também respeita o estoque | `backend/05`; `macroplano` M3 |
| RN-5 | `PUT /items/{itemId}` define a nova quantidade (não soma), com as mesmas regras de RN-3; `DELETE /items/{itemId}` remove a linha; `DELETE /api/cart/v1` esvazia o carrinho; item inexistente ou de outro carrinho devolve 404 | `backend/04` (rotas); decisão derivada |
| RN-6 | Cor e tamanho do item são opcionais na entrada, guardados como texto (até 50 e 20 caracteres) e exibidos na resposta; se informados, devem ser os do produto; se omitidos, o item assume os do produto | decisão do usuário em 26/10/2026 (D-4); `backend/05` ("devem pertencer ao produto"); catálogo D-2 (um valor por produto) |
| RN-7 | O carrinho não guarda preço: o preço unitário vem do produto na hora da leitura, e o subtotal da linha e do carrinho é calculado no servidor | `backend/03` (Cart); `backend/05` |
| RN-8 | Sem frete e sem desconto: `total = subtotal`; o cupom e o frete não existem nesta história | decisão do usuário em 26/10/2026 (D-2, D-5); `frontend/05` (Entrega 3) |
| RN-9 | `Cart` tem `status` `OPEN` ou `CONVERTED`; um carrinho `CONVERTED` não aceita itens; nenhum fluxo desta história o converte (isso é do pedido) | `backend/03`, `backend/05` |
| RN-10 | Carrinhos abandonados são removidos, com os seus itens: um carrinho `OPEN` cuja última escrita foi há mais que o prazo de inatividade é apagado por uma tarefa agendada; o prazo (padrão 1 dia) é configuração do `application.yml`; depois da limpeza, o mesmo token volta a ver um carrinho vazio (RN-2) | decisão do usuário em 26/10/2026 (D-3); `macroplano` M3 |
| RN-11 | O carrinho nasce com dono opcional: `customer_id` nulo, sem FK | `macroplano` (Decisões); `backend/03` |
| RN-12 | A resposta do carrinho traz, por item: `id`, `productId`, `name`, `imageUrl`, `color`, `size`, `unitPrice`, `quantity`, `lineTotal` e `stock`; e, no carrinho: `items`, `itemCount` (soma das quantidades), `subtotal` e `total` | `frontend/05` (Conteúdo); `frontend/03` (Cart/CartItem) |
| RN-13 | O token é um UUID gerado no navegador no primeiro uso, guardado em `localStorage` (Zustand `persist`) e lido pelo interceptor do `httpClient`; nunca aparece em URL nem em log | `frontend/04`; `frontend/03` |
| RN-14 | O carrinho do front é dado do servidor: vive no TanStack Query (`['cart']`); toda mutação (adicionar, alterar, remover, esvaziar) invalida `['cart']`; o carrinho local em Zustand sai | `frontend/04`; `frontend/03` |
| RN-15 | "Add to Cart" existe no card da listagem e no detalhe do produto; com estoque 0 o botão fica desabilitado; o contador do Header é a soma das quantidades de `['cart']` | `catálogo` RN-8; `frontend/05`; `frontend/07` (B18) |
| RN-16 | A tela `/cart` mostra imagem, nome, cor e tamanho, preço, quantidade, total da linha e remover, o resumo (subtotal e total) e "Proceed to Checkout"; sem frete e sem campo de cupom; tem botão para esvaziar; o erro de quantidade do back volta como mensagem inline | `frontend/05` (Entrega 3); `frontend/07` (B8, B9) |
| RN-17 | Cada tela tem os três estados: carregando, vazio (`EmptyState` com link para o shop) e erro | `frontend/05`; `frontend/04` |

## Backend

Ordem de implementação, em `geek-shopping-api`, sem código:

1. **Configuração.** Propriedades do carrinho no `application.yml` (prazo de inatividade, padrão 1 dia, e a periodicidade da limpeza), lidas por uma classe de configuração; `@EnableScheduling` na configuração; `X-Cart-Token` coberto pelo CORS (`WebConfig` já permite todos os headers, o teste de CORS prova).
2. **Migrations (SQL puro; V1 a V5 intactas):** `V6__Create_Table_Carts.sql` (`carts`: `id` `bigint`, `token` `varchar(36)` único, `status` `varchar(20)` com padrão `OPEN`, `customer_id` `bigint` nulo sem FK, `created_at` e `updated_at` `datetime(6)`, índice em `updated_at` para a limpeza) e `V7__Create_Table_Cart_Items.sql` (`cart_items`: `id`, `cart_id` com `ON DELETE CASCADE`, `product_id` com FK para `products`, `quantity` `int`, `color` `varchar(50)` nulo, `size` `varchar(20)` nulo; índice em `cart_id`). Sem índice único composto (a unicidade lógica fica no service, como em `backend/03`). Números conforme o próximo livre em `db/migration`.
3. **Enum `CartStatus`** (`OPEN`, `CONVERTED`) e entidades **`Cart`** e **`CartItem`**, sem Lombok, `equals`/`hashCode` por getters, `LAZY` nas associações, `@Enumerated(EnumType.STRING)`.
4. **`CartRepository`** e **`CartItemRepository`**: busca por token; carrinho com itens e produtos em uma consulta (sem N+1); remoção em lote dos carrinhos abandonados (`@Modifying`); a leitura de produto não carrega o BLOB da imagem (RN-7 do catálogo).
5. **DTOs**: `CartDTO` e `CartItemDTO` de resposta (HAL, como o padrão do projeto) com os campos de RN-12; DTO de entrada para adicionar (`productId`, `quantity`, `color`, `size`) e para alterar (`quantity`), com as constraints de RN-3 e RN-6.
6. **`CartService`**: valida o token (UUID); carrega ou cria o carrinho sob demanda na escrita; aplica RN-3 a RN-7 e RN-9; atualiza `updated_at` em toda escrita; monta a resposta com preço atual, `lineTotal`, `itemCount`, `subtotal` e `total`; links HATEOAS no service. **`CartCleanupService`** (ou tarefa agendada no próprio service) que apaga os carrinhos `OPEN` inativos há mais que o prazo configurado (RN-10).
7. **Exceções e handler**: token ausente ou inválido, quantidade acima do estoque, produto sem estoque e carrinho `CONVERTED` seguem o handler existente (`BadRequestException`/`ProblemDetail` com `errors{}`); item ou produto inexistente: `ResourceNotFoundException`. O header ausente (`MissingRequestHeaderException`) vira 400 `ProblemDetail`, não 500.
8. **Controller e `CartControllerDocs`**: `CartController` em `/api/cart/v1` (`GET`, `DELETE`) e `/api/cart/v1/items` (`POST`, `PUT /{itemId}`, `DELETE /{itemId}`); `@RequestHeader("X-Cart-Token")` documentado; `produces`/`consumes` JSON em todos, inclusive `DELETE`; `@Valid` só na interface; Swagger com os status reais.

Alinhamentos de `backend/07-alinhamento-do-codigo-atual.md` tocados: os que o código novo precisa seguir (`BigDecimal`, `serialVersionUID`, `produces`, `equals`).

## Frontend

Em `geek-shopping-app`:

1. **Modelos e serviço.** `app/core/models/cart.ts` (`Cart`, `CartItem`) e `app/core/api/cart.ts` (`cartService`: `get`, `addItem`, `updateItem`, `removeItem`, `clear`); chaves em `queryKeys` (`cartKeys.all = ['cart']`); o erro do back (incl. `errors{}`) segue pelo `ApiError`.
2. **Token.** Store Zustand com `persist` (`useCartTokenStore`, `partialize`, `version`, `localStorage` indisponível tratado) que gera o UUID no primeiro uso; hook facade `useCartToken`; o interceptor de request do `httpClient` injeta `X-Cart-Token` nas rotas `/api/cart`.
3. **Hooks (TanStack Query).** `useCart()` passa a ler `['cart']` (itens, `itemCount`, `subtotal`, `total`, estados); `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem` e `useClearCart` como mutações que invalidam `['cart']`; `useCartCount` deriva de `useCart`. Sai `useCartStore` e o cálculo do frete fixo.
4. **Pontos de entrada.** `ProductCard` e `ProductDetails`/`ProductDetail` chamam `useAddToCart` (com cor e tamanho do produto); botão desabilitado com estoque 0; feedback por `Toast`; erro do back mostrado ao usuário. O `Header` lê o contador de `useCartCount`.
5. **Tela `/cart`.** `Cart` consome `useCart`; linhas com imagem, nome, cor e tamanho, `PriceTag`, `QuantityStepper` limitado ao estoque, total da linha e remover; resumo com subtotal e total (sem frete, sem cupom); botão de esvaziar; estados carregando, vazio (`EmptyState` com link para `/products`) e erro com nova tentativa; mensagem inline para o erro de quantidade.
6. **Lacunas do design system.** `QuantityStepper` (hoje inline em `Cart`) e `PriceTag`, se ainda não extraídos; composição sem inventar valores de design, e o guardrail visual atualizado se a tela mudar.

Alinhamentos de `frontend/07-alinhamento-do-app-atual.md` tocados: B7, B8, B17 e B18 (parte do carrinho).

## Testes

- **Unitários (back):** `CartService` por regra (RN-1 a RN-12): token inválido, criação sob demanda, soma de item repetido, limite de estoque, produto sem estoque, `CONVERTED`, preço atual no subtotal, 404 de item de outro carrinho, GET vazio sem gravar; `CartCleanupService` com o prazo configurado (apaga o inativo, preserva o recente); mapeamentos.
- **UI (front):** `cartService` (contrato, erro normalizado, header do token), store do token (geração, `persist`, `localStorage` indisponível), hooks (chaves, invalidação, estados), `ProductCard`/detalhe/`Cart`/`Header` nos estados carregando, vazio e erro, botão desabilitado sem estoque, `QuantityStepper` limitado ao estoque (MSW com o contrato real).
- **Integração (back, MySQL real):** fluxo ordenado criar → consultar → somar → alterar → remover → esvaziar com `X-Cart-Token`; 400 sem header e com UUID inválido; 400 acima do estoque; 404 de item inexistente; limpeza de abandonados com prazo curto na configuração de teste; CORS com `X-Cart-Token` a partir de `http://localhost:3000`; Swagger.
- **E2E (Playwright, executado pelo usuário):** Home ou shop → adicionar ao carrinho → contador do Header → `/cart` → alterar e remover; recarregar a página mantém o carrinho (token em `localStorage`).

Mapeamento `RN` → camada: RN-1 a RN-12 (back: unitário e integração); RN-13 a RN-17 (front: UI; E2E para o fluxo).

## Riscos

- O token é a única credencial: quem o tem controla o carrinho (aceito, sem login).
- Estoque verificado e não reservado: o item pode passar a exceder o estoque depois de adicionado; a leitura devolve `stock` e o front limita a quantidade, mas a garantia final é do pedido (entrega 5).
- Limpeza agendada apagando um carrinho em uso: mitigado porque toda escrita renova `updated_at`; ver pontos em aberto sobre a leitura.
- Cor e tamanho guardados no item sem opções reais no catálogo: o valor é sempre o do produto; se o catálogo ganhar variantes, o item precisará de revisão.
- Perder o carrinho local atual ao publicar (não há migração).
- Falta de índice em `updated_at` ou carga de `cart_items` com produto completo pesaria a leitura; as consultas devem trazer só o necessário e sem o BLOB.

## Pontos em aberto

1. **Status do erro de estoque.** `POST`/`PUT` com quantidade acima do estoque ou produto sem estoque: proposta de 400 `ProblemDetail` com `errors.quantity` (as specs só definem 409 para o pedido); confirmar.
2. **Status do `POST` de item.** `201 Created` ou `200` (a proposta geral das specs é 201 para criação; aqui o item pode somar a um existente). Sugestão: 200 com o carrinho completo, já que `POST` também soma.
3. **Resposta das mutações.** Sugestão: toda mutação devolve o `CartDTO` atualizado (e `DELETE` do carrinho e do item, 204); confirmar.
4. **A leitura renova a inatividade?** Sugestão: só escritas renovam `updated_at`; um carrinho só lido por mais de um dia seria apagado.
5. **Periodicidade da limpeza.** Sugestão: expressão `cron` configurável, padrão de hora em hora, no `application.yml`; confirmar o nome das propriedades.
6. **Produto excluído com itens em carrinhos.** Sugestão: `ON DELETE CASCADE` em `cart_items.product_id`, para o produto sair dos carrinhos; alternativa, bloquear a exclusão (409, `ConflictException` ainda inexistente).
7. **Carrinho `CONVERTED` recebendo escrita.** Nenhum fluxo o converte nesta história; sugestão 400 na escrita, com teste por fixture.
8. **Carrinho local atual (Zustand).** Sugestão: descartar, sem migrar os itens para a API; confirmar.
9. **Validação de cor e tamanho.** Comparação sem diferenciar maiúsculas contra os valores do produto; confirmar.
10. **Quantidade máxima por requisição.** Além do estoque, definir um teto (ex.: 99) ou deixar só o estoque; sugestão, só o estoque.
11. **História `frete-do-carrinho`** (pedido do usuário): criado o esqueleto em `docs/plans/stories/frete-do-carrinho.md`, todas as etapas pendentes.
12. **Specs a atualizar:** `backend/03` (cor e tamanho do item como texto, não ids), `backend/05` (limpeza de abandonados com prazo configurável) e `frontend/07` (B7, B8).

## Critérios de aceite

| ID | Critério | Verifica |
|---|---|---|
| AC-1 | `GET /api/cart/v1` sem `X-Cart-Token`, ou com um valor que não é UUID, responde 400 | RN-1 |
| AC-2 | `GET` com um token novo responde 200 com `items` vazio, `itemCount` 0, `subtotal` e `total` 0, e nenhum registro é criado | RN-2, RN-8 |
| AC-3 | `POST /items` com produto válido cria o carrinho do token e devolve o item com preço, `lineTotal` e `stock` | RN-2, RN-12 |
| AC-4 | Adicionar o mesmo produto, cor e tamanho de novo soma a quantidade em um único item | RN-4 |
| AC-5 | Quantidade 0, negativa ou acima do estoque, e produto sem estoque, são rejeitados com 400 e mensagem no campo `quantity`; o carrinho não muda | RN-3 |
| AC-6 | Cor ou tamanho que não são os do produto são rejeitados com 400; omitidos, o item assume os do produto | RN-6 |
| AC-7 | `PUT /items/{itemId}` troca a quantidade (não soma); `DELETE /items/{itemId}` remove a linha; item inexistente ou de outro token responde 404 | RN-5 |
| AC-8 | `DELETE /api/cart/v1` deixa o carrinho vazio | RN-5 |
| AC-9 | Se o preço do produto muda, a próxima leitura traz o preço novo e o subtotal recalculado, sem frete nem desconto | RN-7, RN-8 |
| AC-10 | Um carrinho `CONVERTED` rejeita a adição de itens | RN-9 |
| AC-11 | A tarefa de limpeza apaga o carrinho inativo além do prazo configurado, com os itens, e preserva o recente; o prazo vem do `application.yml` | RN-10 |
| AC-12 | Uma requisição de `http://localhost:3000` com `X-Cart-Token` passa no CORS | RN-1 |
| AC-13 | No front, o token é gerado uma vez, persiste ao recarregar e vai no header de toda chamada do carrinho, sem aparecer em URL | RN-13 |
| AC-14 | Adicionar pelo card da listagem e pelo detalhe atualiza o contador do Header; produto esgotado tem o botão desabilitado | RN-14, RN-15 |
| AC-15 | `/cart` mostra os itens do servidor, permite alterar quantidade (limitada ao estoque), remover e esvaziar, e mostra subtotal e total sem frete nem cupom | RN-16 |
| AC-16 | Carrinho vazio, carregando e erro (com nova tentativa) têm tela própria; o erro de quantidade do back aparece inline | RN-17 |
| AC-17 | Recarregar a página mantém o carrinho; o carrinho local em Zustand e o frete fixo de 10 não existem mais | RN-13, RN-14, RN-8 |

## Implementado

### Backend

Concluído em 26/10/2026 23:10. Pasta `geek-shopping-api`.

**Migrations** (SQL puro, V1 a V5 intactas):
- `V6__Create_Table_Carts.sql`: `carts` (`token` único, `status` padrão `OPEN`, `customer_id` nulo sem FK, `created_at`, `updated_at`, índice `(status, updated_at)` para a limpeza).
- `V7__Create_Table_Cart_Items.sql`: `cart_items` (`cart_id` e `product_id` com FK e `ON DELETE CASCADE`, `quantity`, `color`, `size`).

**Arquivos novos** (`src/main/java/br/com/erudio`):
- `model/CartStatus`, `model/Cart`, `model/CartItem`: entidades e enum (`LAZY`, `EnumType.STRING`, itens ordenados por `id`, `orphanRemoval`).
- `repositories/CartRepository`: `findWithItemsByToken` (carrinho, itens e produtos em uma consulta, sem o BLOB) e `deleteAbandoned` (`@Modifying`).
- `data/dto/CartDTO`, `data/dto/CartItemDTO` (HAL, com links) e `data/dto/request/CartItemRequestDTO`, `CartItemQuantityRequestDTO` (constraints).
- `services/CartService`: token UUID, criação sob demanda, soma de item repetido, estoque verificado, cor e tamanho do produto, preço atual, subtotal e total no servidor, links HATEOAS.
- `services/CartCleanupService` e `config/SchedulingConfig`: limpeza agendada dos carrinhos `OPEN` inativos.
- `controllers/CartController` e `controllers/docs/CartControllerDocs`.
- `exception/FieldValidationException`: 400 com `errors{campo}`.

**Arquivos alterados:** `exception/handler/CustomEntityResponseHandler` (handler de `FieldValidationException`); `application.yml` principal e de teste (`cart.cleanup.inactivity: 1d` e `cart.cleanup.cron`). `WebConfig` não mudou: o CORS já permite todos os headers, inclusive `X-Cart-Token` (o teste de CORS fica para a etapa de integração).

**Endpoints** (todos exigem `X-Cart-Token`):
- `GET /api/cart/v1`: 200.
- `DELETE /api/cart/v1`: 204.
- `POST /api/cart/v1/items`: 200 com o carrinho.
- `PUT /api/cart/v1/items/{itemId}`: 200 com o carrinho.
- `DELETE /api/cart/v1/items/{itemId}`: 204.

**Pontos em aberto resolvidos com a sugestão do plano:** erro de estoque, produto esgotado, cor ou tamanho diferentes do produto e carrinho `CONVERTED` devolvem 400 `ProblemDetail` com `errors.quantity`, `errors.color`, `errors.size` ou `errors.cart` (itens 1 e 7); `POST` de item devolve 200 (2); mutações devolvem o carrinho e os `DELETE` devolvem 204 (3); só escritas renovam `updated_at` (4); limpeza por `cron` configurável, padrão de hora em hora (5); `ON DELETE CASCADE` também em `product_id` (6); cor e tamanho comparados sem diferenciar maiúsculas (9); sem teto de quantidade além do estoque (10).

**Build:** `./mvnw -q clean package -DskipTests` em `geek-shopping-api`: sucesso (jar gerado). Nenhum teste foi escrito nem executado nesta etapa; a aplicação não foi iniciada. Busca por `lombok`, comentários e `bigint(`/`int(` nos arquivos novos: sem ocorrências.

**RN cobertas:** RN-1 a RN-12 (RN-2 com `GET` sem gravar; RN-10 pelo `CartCleanupService`). **AC com código pronto:** AC-1 a AC-12 (a verificação fica para os testes).

**Alinhamento (`backend/07`):** a área do catálogo já estava alinhada pela história anterior; nada a alinhar nesta etapa. O código novo segue `BigDecimal`, `serialVersionUID`, `produces`/`consumes` em todos os endpoints e `@Valid` só na interface.

**Observações para as próximas etapas:** `equals`/`hashCode` de `Cart` e `CartItem` não incluem as associações (evita ciclo e carga de proxies); `CartService.imagePath` repete o helper privado de `ProductService`; a criação concorrente do mesmo token pela primeira vez pode violar a chave única e devolver 500 (janela mínima); o `@Scheduled` roda também nos testes de integração (cron de hora em hora).

### Frontend

Concluído em 26/10/2026 23:21. Pasta `geek-shopping-app`.

**Arquivos novos:**
- `app/core/models/cart.ts`, `app/core/api/cart.ts` (`cartService`: `get`, `addItem`, `updateItem`, `removeItem`, `clear`; `imageUrl` absoluta com `toApiUrl`; resposta sem `items` vira lista vazia) e `cartKeys` em `app/core/api/queryKeys.ts`.
- `app/core/utils/uuid.ts` (UUID v4 com fallback sem `crypto.randomUUID`) e `app/core/utils/errorMessage.ts` (mensagem do primeiro campo de `ApiError.fields`, senão `message`).
- `app/store/modules/cart/useCartTokenStore.ts` (Zustand `persist`, chave `geek-shopping-cart-token`, `version` 1, `partialize` só o token, `ensureToken()`).
- `app/store/modules/global/useToastStore.ts`, `hooks/useToast/useToast.ts` e `components/ui/molecules/Toast/` (renderizado em `app/(dashboard)/layout.tsx`).
- Hooks: `useUpdateCartItem`, `useRemoveCartItem`, `useClearCart` (mutações que invalidam `['cart']`; as duas últimas mostram toast de erro).
- Suporte de teste: `test/msw/serveCart.ts` (carrinho em memória no MSW, `holdAddRequests`), `buildCartItemResponse`/`buildCartResponse`/`CART_URL` em `test/fixtures.ts` e handler padrão de `GET` do carrinho em `test/msw/handlers.ts`.

**Arquivos alterados:**
- `app/core/api/httpClient.ts`: o interceptor de request injeta `X-Cart-Token` em toda chamada `/api/cart`.
- `hooks/useCart` (agora `useQuery(['cart'])`, sem frete), `hooks/useAddToCart` (mutação com toast e `onAdded`, devolve `{ addItem, isPending }`) e `hooks/useCartCount` (deriva de `useCart`).
- `components/feature/Cart` (itens do servidor, cor/tamanho sob o nome, `QuantityStepper` limitado ao estoque, remover, "Clear cart", resumo só com Subtotal e Total, erro de quantidade inline, estados carregando/vazio/erro), `ProductCard`, `ProductDetails` (quick view), `ProductDetail` (botão desabilitado enquanto adiciona) e `Checkout` (itens da API, sem linha de frete, `Spinner` enquanto carrega, limpa o carrinho pela API no "Place Order" demo).
- `CLAUDE.md` do app e a skill `geek-shopping-app-visual-identity` (inventário com `Toast`; saídas deliberadas: tela do carrinho sem frete e sem cupom, cor/tamanho sob o nome, botão de esvaziar).

**Arquivos removidos:** `app/store/modules/cart/useCartStore.ts` (carrinho local em Zustand). O arquivo está só removido do disco; o git não foi tocado.

**Testes reescritos (decisão do usuário em 26/10/2026, "reescrever os testes agora"):** os 9 arquivos de teste que dependiam do carrinho local passaram a usar o MSW com o carrinho em memória: `app/store/modules/__test__/stores.test.ts` (token e toast), `hooks/__test__/useCart.test.tsx`, `components/feature/Cart/__test__/Cart.test.tsx`, e ajustes em `Header`, `Home`, `ProductDetail`, `ProductCard` e `Products`. Isso antecipa parte do `/erudio:dev-ui-tests`, que ainda deve cobrir o que faltar (ver os pontos em aberto).

**Telas e rotas:** `/cart`, contador do Header, "Add to Cart" no card da listagem, no quick view e em `/products/[id]`, e `/checkout` (demo). Nenhuma rota nova.

**Endpoints consumidos** (todos com `X-Cart-Token`): `GET /api/cart/v1`; `DELETE /api/cart/v1`; `POST /api/cart/v1/items`; `PUT /api/cart/v1/items/{itemId}`; `DELETE /api/cart/v1/items/{itemId}`.

**Validação** (`geek-shopping-app`):
- `npx tsc --noEmit`: sem erros.
- `npm run lint`: 0 erros, 7 avisos `no-img-element` que já existiam.
- `npm run build`: sucesso (8 rotas).
- `npx vitest run`: 20 arquivos, 397 testes passando.
- Conferência visual: **pendente** (o servidor de desenvolvimento não foi iniciado).

**RN cobertas:** RN-13 a RN-17. **AC com código pronto:** AC-13 a AC-17 (a verificação ponta a ponta fica para a etapa de integração e para a conferência visual).

**Diferenças entre spec e código do backend:** o item do carrinho tem `color` e `size` em texto (a spec `backend/03` e `frontend/03` falam em `color_id`/`size_id`); as mutações `POST`/`PUT` devolvem o carrinho e os dois `DELETE` devolvem 204, então o front sempre refaz o `GET`; o erro de estoque vem em `errors.quantity` (400 `ProblemDetail`).

**Alinhamento (`frontend/07`):** tratados B7 (carrinho via Query, mock e pré-semeio já tinham saído), B8 (frete fixo removido do carrinho e do checkout), B17 (interceptor com `X-Cart-Token`) e a parte de carrinho de B18 (botão desabilitado sem estoque, erro do back como mensagem). B9 (cupom no carrinho) já estava resolvido: o carrinho não tem campo de cupom.

**Observações para as próximas etapas:** o "Add to Cart" não envia `color`/`size` (o back assume os do produto); o `README.md` e o `ARCHITECTURE.md` do app seguem desatualizados (débito já catalogado); os specs E2E existentes não foram alterados nem executados (precisam da API e do app no ar).

### Testes de Backend

Concluído em 26/10/2026 23:28. Pasta `geek-shopping-api`, `src/test/java/br/com/erudio`.

**Classes criadas:**
- `unittests/mapper/mocks/MockCart`: builder do carrinho e dos itens, com valores previsíveis (token fixo, `updatedAt` fixo).
- `unittests/services/CartServiceTest`: 46 testes (JUnit 6 + Mockito, sem Spring), uma regra por teste, nomeados por `RN` no `@DisplayName`.
- `unittests/services/CartCleanupServiceTest`: 3 testes da limpeza agendada (período configurado injetado com `ReflectionTestUtils`).
- `repository/CartRepositoryTest`: 8 testes `@DataJpaTest` com o MySQL do Testcontainers, só para as consultas customizadas (`findWithItemsByToken` e `deleteAbandoned`) e para a cascata do banco.

**Arquivo existente ajustado:** `integrationtests/swagger/SwaggerIntegrationTest.onlyTheVersionedApiPathsAreDocumented` esperava exatamente as rotas de `/api/product/v1`; passou a esperar também `/api/cart/v1`, `/api/cart/v1/items` e `/api/cart/v1/items/{itemId}`. A igualdade exata do conjunto continua. Nenhum código de produção foi alterado.

**Mapeamento RN → teste:**
- RN-1: `rejectsInvalidToken` (5 valores), `rejectsNullToken`, `normalizesTheToken`, `invalidTokenDoesNotLoadTheProduct`.
- RN-2: `findReturnsAnEmptyCartWithoutWriting`, `addItemCreatesTheCartOnTheFirstWrite`, `clearWithoutACartDoesNothing`.
- RN-3: `addItemWithinTheStock`, `addItemAboveTheStock`, `addItemOfAProductWithoutStock`, `addItemOfAMissingProduct`, `addItemWithANullRequest`, `updateItemAboveTheStock`.
- RN-4: `addItemSumsTheQuantity`, `addItemSumAboveTheStock`, `addItemOfAnotherProductCreatesAnotherLine`.
- RN-5: `updateItemSetsTheQuantity`, `updateItemOfAnotherCartIsNotFound`, `updateItemWithoutACart`, `removeItem`, `removeItemThatDoesNotExist`, `clearEmptiesTheCart`.
- RN-6: `addItemTakesTheColorAndSizeOfTheProduct`, `addItemWithBlankColorAndSize`, `addItemWithMatchingColorAndSize`, `addItemWithAnotherColor`, `addItemWithAnotherSize`, `addItemWithAColorForAProductWithoutColor`, `addItemOfAProductWithoutColorAndSize`.
- RN-7: `readsTheCurrentPriceOfTheProduct`.
- RN-8 e RN-12: `totalsAreComputedByTheServer`, `itemFields`, `itemWithoutImage`, `cartLinks`, `itemLinks`, `emptyCartLinks`.
- RN-9: `convertedCartRejectsNewItems`, `convertedCartRejectsOtherWrites`, `convertedCartCanBeRead`.
- RN-10: `writesRenewUpdatedAt`, `readsDoNotRenewUpdatedAt`, os 3 testes de `CartCleanupServiceTest` e `CartRepositoryTest` (`deleteAbandonedRemovesOnlyOpenCartsInactiveBeforeTheLimit`, `deleteAbandonedRemovesTheItemsOfTheRemovedCart`, `deleteAbandonedKeepsACartInactiveExactlyAtTheLimit`).
- RN-11: `newCartHasNoOwner`.
- RN-13 a RN-17: front, cobertos em `/erudio:dev-ui-tests` (já há testes do front desde a etapa de frontend).
- Consultas e cascata do banco: `findWithItemsByTokenLoadsTheItemsAndTheirProducts`, `findWithItemsByTokenReturnsTheCartOfThatTokenOnly`, `findWithItemsByTokenReturnsEmptyForAnUnknownToken`, `findWithItemsByTokenReturnsACartWithoutItems`, `deletingAProductRemovesItsItemsFromTheCarts`.

**AC verificados por unidade/repositório:** AC-2 (parcial, sem gravar), AC-4, AC-5, AC-6, AC-7 (service), AC-8 (service), AC-9, AC-10, AC-11. AC-1, AC-3, AC-12 e o contrato HTTP ficam para os testes de integração.

**Comando e resultado:** `./mvnw test` em `geek-shopping-api` (Docker ativo): 328 testes, 0 falhas, 0 erros, 0 ignorados (BUILD SUCCESS). Os 57 testes novos do carrinho (46 + 3 + 8) rodaram também isolados com `-Dtest='CartServiceTest,CartCleanupServiceTest,CartRepositoryTest'`.

**Não executado:** nada ficou de fora; `StartupTests` passou com o contêiner do Testcontainers.

**Defeito de produção encontrado:** nenhum. Observação (tolerável): o token é validado com `UUID.fromString`, que aceita formas abreviadas como `1-1-1-1-1`; elas viram um token "válido" distinto. Não afeta a segurança do carrinho, só a normalização.

### Testes de Frontend

Concluído em 26/10/2026 23:33. Pasta `geek-shopping-app`. Parte dos testes foi reescrita na etapa de frontend (decisão do usuário em 26/10/2026); esta etapa revisou a cobertura e completou o que faltava.

**Arquivos criados:**
- `app/core/api/__test__/cart.test.ts` (14 testes): mapeamento do carrinho (`imageUrl` absoluta, cor/tamanho nulos, carrinho vazio, resposta sem `items`), as cinco operações do `cartService`, o mesmo token em todas, e a normalização de erros (`ProblemDetail` com `errors.quantity`, `ExceptionResponse` 404, requisição sem resposta, header de token ausente).
- `components/ui/molecules/__test__/Toast.test.tsx` (8 testes): vazio, tons `success`/`error`/`info` (papéis `status`/`alert`), pilha, fechar uma mensagem, fechamento automático em 4 s e contagem por mensagem.
- `components/feature/Checkout/__test__/Checkout.test.tsx` (7 testes): carregando, vazio, resumo com os totais do servidor e sem frete, erro do carrinho, endereço de entrega, "Place Order" esvaziando o carrinho pela API e toast de erro se falhar.

**Arquivos ampliados:**
- `app/core/api/__test__/httpClient.test.ts`: interceptor do token (header em todas as rotas `/api/cart`, mesmo token reaproveitado, token salvo, nenhum header nem token criado fora do carrinho).
- `app/core/utils/__test__/utils.test.ts`: `generateUuid` (v4, valores distintos, fallback sem `randomUUID`) e `getErrorMessage`.
- `app/store/modules/__test__/stores.test.ts`: `localStorage` que recusa gravar e que recusa ler.
- Da etapa anterior, já cobrindo o carrinho: `hooks/__test__/useCart.test.tsx` (19), `components/feature/Cart/__test__/Cart.test.tsx` (14), e os ajustes em `Header`, `Home`, `ProductDetail`, `ProductCard` e `Products`.

**Mapeamento RN → teste (front):**
- RN-13: `stores.test.ts` (token: gerar, manter, persistir só o token, reidratar, `localStorage` que falha ao gravar e ao ler), `httpClient.test.ts` (interceptor), `utils.test.ts` (`generateUuid`), `cart.test.ts` (mesmo token em todas as operações) e `Cart.test.tsx` (`sends the token of the browser in every request`).
- RN-14: `useCart.test.tsx` (`useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem`, `useClearCart` invalidam e atualizam `['cart']`; erro exposto), `cart.test.ts`, `Cart.test.tsx`.
- RN-15: `ProductCard.test.tsx` (adiciona uma unidade, desabilita enquanto adiciona e sem estoque), `Products.test.tsx` (quick view da grade), `ProductDetail.test.tsx` (quantidade escolhida, esgotado), `Home.test.tsx` (esgotado), `Header.test.tsx` (contador soma as quantidades e atualiza ao adicionar), `Toast.test.tsx`.
- RN-16: `Cart.test.tsx` (itens, cor/tamanho, totais do servidor, sem frete e sem cupom, quantidade limitada ao estoque, erro de quantidade inline, remover, esvaziar, `Proceed To Checkout`).
- RN-17: `Cart.test.tsx` e `Checkout.test.tsx` (carregando, vazio, erro com nova tentativa), `Header.test.tsx`.

**AC cobertos no front:** AC-13, AC-14, AC-15, AC-16; AC-17 só em parte (o carrinho local e o frete fixo saíram e o carrinho vem do servidor; "recarregar mantém o carrinho" depende do E2E).

**Comandos e resultados** (`geek-shopping-app`):
- `npx vitest run`: 23 arquivos, 442 testes passando.
- `npx tsc --noEmit`: sem erros.
- `npm run lint`: 0 erros, 7 avisos `no-img-element` que já existiam.
- `npm run build`: sucesso.

**Dependências adicionadas:** nenhuma (MSW e Testing Library já estavam instalados). A configuração de cobertura do `vitest.config.ts` já não excluía `app/core/api` nem `app/store`; nada a ajustar.

**Defeito de produção encontrado e corrigido (autorizado pelo usuário em 26/10/2026):** o teste `still returns a token when localStorage refuses to save it` mostrou que, quando o `localStorage` recusa gravar (cota cheia ou armazenamento bloqueado), `ensureToken()` lançava dentro do interceptor e toda chamada do carrinho falhava. Correção em `app/store/modules/cart/useCartTokenStore.ts`: o `persist` passou a usar um armazenamento protegido por `try/catch` (o token fica em memória quando não dá para gravar ou ler). Registrado em `## Alertas e débitos técnicos` como TD-1, `Corrigido`.

**Observações:** os specs E2E (Playwright) não foram escritos nem executados aqui (etapa de integração). A conferência visual segue pendente.

### Testes de Integração

Concluído em 26/10/2026 23:41. Imagem do MySQL do Testcontainers: `mysql:9.1.0` (fixa, com `mysql-default-conf`), iniciada uma vez por JVM pelo `AbstractIntegrationTest` existente. Docker confirmado com `docker info` antes de começar.

**Infraestrutura nova** (`geek-shopping-api/src/test/java/br/com/erudio/integrationtests`): `CartApi` (helper com o header `X-Cart-Token`, requisições e asserts de `ProblemDetail`), `dto/CartDTO` e `dto/CartItemDTO` (espelhos dos DTOs). Reaproveitados: `ApiIntegrationTest`, `ProductApi`, `TestConfigs`.

**Classes criadas:**
- `controllers/withjson/CartControllerJsonTest` (12, fluxo ordenado, classe sempre rodada inteira): carrinho vazio para token novo, adicionar cria o carrinho com o preço atual, links do carrinho e dos itens (`_links`), soma do mesmo produto, outra linha, leitura, atualizar define a quantidade (não soma), atualizar acima do estoque recusado, remover, esvaziar (e esvaziar de novo), carrinho aceita itens depois de esvaziado.
- `controllers/withjson/CartControllerErrorsJsonTest` (34): todas as rotas sem o header (400 `ProblemDetail`), token que não é UUID (400 `ExceptionResponse`, 4 valores, 5 rotas), token em maiúsculas é o mesmo carrinho, leitura e `DELETE` não gravam nada, primeira escrita cria o carrinho `OPEN` sem dono, isolamento entre tokens, corpo vazio, quantidade abaixo de 1, `productId` inválido, cor/tamanho longos, acima do estoque (sem criar o carrinho), quantidade enorme e fora do inteiro (400, nunca 500), soma acima do estoque, produto esgotado, produto inexistente (404), cor/tamanho de outro produto, cor/tamanho sem diferença de caixa, item inexistente/de outro carrinho (404), `itemId` não numérico, JSON malformado (400), `text/plain` (415), `Accept` XML (406), métodos não permitidos (405).
- `controllers/withjson/CartLifecycleJsonTest` (8, com `JdbcTemplate` e o `CartCleanupService` reais): mudança de preço do produto aparece na leitura seguinte, redução de estoque aparece no item e bloqueia crescimento, produto excluído sai de todos os carrinhos, carrinho `CONVERTED` pode ser lido e recusa qualquer escrita, só escritas renovam `updated_at`, limpeza remove o abandonado com os itens e preserva o recente e o convertido, o mesmo token recomeça vazio após a limpeza, o prazo padrão de 1 dia vem da configuração (23 h fica, 25 h sai).
- `controllers/cors/withjson/CartCorsJsonTest` (9): leitura e escrita a partir de `http://localhost:3000` com `X-Cart-Token`, preflight de GET/POST/PUT/DELETE com `x-cart-token` permitido, origem fora da lista 403 `Invalid CORS request`, preflight rejeitado, requisição sem `Origin`.
- `swagger/SwaggerIntegrationTest` (+4, total 11): status reais de todas as operações do carrinho, sem 403, `X-Cart-Token` como header obrigatório em todas, corpos só JSON e `itemId` como parâmetro de caminho.

**Spec E2E (Playwright), executado pelo usuário:** `geek-shopping-app/e2e/cart.spec.ts` (10 testes): adicionar pela página do produto e pelo card, badge, `/cart`, token igual em toda chamada e salvo no `localStorage`, recarregar mantém o carrinho, somar o mesmo produto, alterar quantidade e remover, esvaziar, resumo e checkout sem frete e sem cupom, dois navegadores com carrinhos separados. Também ajustei `e2e/catalog.spec.ts` (`getByText('Added to your cart.').first()`), porque o Toast novo repete a mensagem. **Não foi executado:** exige a API em `:8080`, o MySQL e o app em `:3000` no ar, e a execução é do usuário. Validado com `npx playwright test --list` (18 testes em 2 arquivos) e `npx tsc --noEmit`. **Pendência aceita pelo usuário em 26/10/2026:** fechar a etapa com o E2E ainda sem resultado (`npm run e2e`).

**Mapeamento RN/AC → teste:**
- RN-1 / AC-1 / AC-12: `CartControllerErrorsJsonTest` (header ausente, token inválido, maiúsculas), `CartCorsJsonTest`, `SwaggerIntegrationTest` (header obrigatório).
- RN-2 / AC-2 / AC-3: `CartControllerJsonTest` (1, 2), `CartControllerErrorsJsonTest` (leitura não grava, primeira escrita cria o carrinho).
- RN-3 / AC-5: `CartControllerErrorsJsonTest` (quantidade < 1, acima do estoque, esgotado, produto inexistente, valores enormes), `CartControllerJsonTest` (8).
- RN-4 / AC-4: `CartControllerJsonTest` (4, 5), `CartControllerErrorsJsonTest` (soma acima do estoque).
- RN-5 / AC-7 / AC-8: `CartControllerJsonTest` (7, 9, 10, 11), `CartControllerErrorsJsonTest` (404 e isolamento).
- RN-6 / AC-6: `CartControllerErrorsJsonTest` (cor/tamanho de outro produto, sem diferença de caixa), `CartControllerJsonTest` (2).
- RN-7 / RN-8 / AC-9: `CartControllerJsonTest` (2, 5, 6, total = subtotal), `CartLifecycleJsonTest` (mudança de preço).
- RN-9 / AC-10: `CartLifecycleJsonTest` (`CONVERTED`).
- RN-10 / AC-11: `CartLifecycleJsonTest` (limpeza, prazo de 1 dia, renovação por escrita, recomeço do token).
- RN-11: `CartControllerErrorsJsonTest` (sem dono).
- RN-12: `CartControllerJsonTest` (campos, links).
- RN-13 a RN-17 / AC-13 a AC-17: Vitest (etapa anterior) e `e2e/cart.spec.ts` (pendente de execução).

**Comando e resultado:** `./mvnw test` em `geek-shopping-api`: 395 testes, 0 falhas, 0 erros, 0 ignorados (BUILD SUCCESS), incluindo `StartupTests` e os testes de repositório. Os 74 testes de integração novos rodaram também isolados. No app: `npx vitest run` 442 passando, `npx tsc --noEmit` e `npm run lint` sem erros (7 avisos antigos).

**Defeito de produção encontrado:** nenhum nesta etapa.

## Resultados dos reviews

### Code Review

Executado em 26/10/2026 23:47 pelo agente `erudio:code-reviewer` (somente leitura). Escopo: 89 arquivos da história (backend, migrations, testes do backend, frontend, testes e E2E do frontend, documentação do app).

**Escopo analisado:** a história, `docs/specs/backend/02, 03, 04, 05, 07`, `docs/specs/frontend/02, 03, 04, 05, 07`, os `CLAUDE.md`, o guardrail visual; todos os arquivos de produção do carrinho (back e front), `V6` e `V7`, `application.yml` principal e de teste; leitura integral de `CartControllerErrorsJsonTest`, `CartLifecycleJsonTest`, `CartCleanupServiceTest`, diff de `SwaggerIntegrationTest`, `serveCart.ts` (até a linha 80); leitura parcial de `CartServiceTest` (linhas 1-120). Não foram lidos por inteiro: `CartRepositoryTest`, `CartControllerJsonTest`, `CartCorsJsonTest`, `CartApi`, `MockCart`, os DTOs de integração e a maior parte dos testes do front; `e2e/catalog.spec.ts` não foi aberto; a tela `/cart` não foi comparada com `MultiShop/cart.html` (conferência visual pendente na história). Nada foi compilado nem executado pelo agente.

**Aderência à história (RN/AC, fora do escopo):** CR-1 e CR-2.
**Camadas, nomes e estilo do backend:** CR-3, CR-4, CR-5, CR-6.
**Migrations:** checado, sem achados (V6 e V7 novas e sequenciais, SQL nativo, sem *display width*, `NOT NULL` coerente com as entidades, FKs em cascata conforme `backend/03`).
**Contrato da API, erros e validação:** CR-7, CR-8.
**Arquitetura do frontend:** CR-9. Demais itens checados (direção de dependência, `['cart']` no Query com invalidação nas quatro mutações, token em Zustand com `persist`, interceptor só em `/api/cart`, modelos coerentes com os DTOs; `useCartStore` sem referências em código, só em `ARCHITECTURE.md`).
**Guardrails visuais do frontend:** CR-10. Demais itens checados (raio 0, só `react-icons/fa`, `SectionTitle`, `--background`/`--surface`, saídas deliberadas registradas no guardrail).
**Testes presentes:** CR-11. Nenhum teste desabilitado; os lidos fazem asserts de comportamento real.

#### CR-1 · Checkout mostra "Your cart is empty" quando a API do carrinho falha
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-app/components/feature/Checkout/Checkout.tsx:29` e `:65`
- Evidência: a tela lê só `{ items, subtotal, total, isLoading }` de `useCart()` e ignora `isError` e `refetch`; com erro, `items` cai em `NO_ITEMS` e a tela entra no ramo `items.length === 0`. O teste `Checkout.test.tsx:59` ("shows the error state of the cart as an empty checkout instead of crashing") fixa esse comportamento. O registro dos testes de frontend afirma que `Checkout.test.tsx` cobre "erro com nova tentativa" em RN-17, o que não é verdade.
- Correção sugerida: ler `isError`/`refetch` e mostrar `InlineAlert` com "Try again", como em `Cart.tsx:39-45`; ajustar o teste; base: RN-17, AC-16 e `frontend/04` (estados de tela). Esforço pequeno.
- Se nada for feito: Prós: o checkout é demo e vira tela própria na entrega 4. · Contras: com o back fora do ar o usuário lê que o carrinho está vazio, e o registro da etapa afirma uma cobertura inexistente.

#### CR-2 · Itens do plano não seguidos ao pé da letra
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/hooks/useAddToCart/useAddToCart.ts:11`, `geek-shopping-app/components/feature/Cart/Cart.tsx:84`, `geek-shopping-api/src/main/java/br/com/erudio/services/CartCleanupService.java:25-28`; `hooks/useCartToken` não existe
- Evidência: o plano pede o facade `useCartToken` (não criado; só o interceptor lê o store), `useAddToCart` com cor e tamanho do produto (envia só `productId` e `quantity`; o registro já diz isso), `PriceTag` no carrinho (a célula usa `formatPrice(item.unitPrice)`), um `CartItemRepository` (não existe; os itens são gravados por cascade) e as propriedades "lidas por uma classe de configuração" (estão em `@Value` no service).
- Correção sugerida: registrar os desvios em `## Implementado`; opcionalmente criar `hooks/useCartToken` quando algum componente precisar do token. Esforço pequeno.
- Se nada for feito: Prós: o comportamento é o mesmo (o back assume cor e tamanho do produto, RN-6) e não há consumidor para o facade nem `oldPrice` no item. · Contras: plano e código ficam divergentes sem registro.

#### CR-3 · `CartService` monta os DTOs à mão, sem `DozerMapper`
- Severidade: média
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:178-210`
- Evidência: `toDto` e `toItemDto` criam `CartDTO` e `CartItemDTO` com `new` e setters. `backend/02` ("Service: converte com `DozerMapper`") e `geek-shopping-api/CLAUDE.md` ("entity ↔ DTO conversion never happens by hand") pedem Dozer; `backend/02` também diz que campos derivados são calculados no service.
- Correção sugerida: manter e registrar o desvio em `## Implementado`: o item junta campos do produto com o derivado `lineTotal`, que o Dozer não mapeia direto. Esforço pequeno.
- Se nada for feito: Prós: mapeamento explícito e testado (`itemFields`), sem Dozer artificial. · Contras: contraria uma regra escrita como absoluta no `CLAUDE.md`, sem registro.

#### CR-4 · `equals` de `Cart` e `CartItem` em uma linha e sem as associações (conhecido)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/model/Cart.java:114`, `CartItem.java:97`
- Evidência: o `equals` de `Cart` fica todo em uma linha (mesma dívida de `Product.java`, catalogada em `backend/07` #17) e nenhum dos dois inclui associações; a etapa de backend registrou isso como deliberado.
- Correção sugerida: quebrar as condições com `&&` no fim da linha quando a #17 for tratada. Esforço pequeno.
- Se nada for feito: Prós: segue o padrão de `Product`, e excluir as associações evita ciclos e carga de proxies. · Contras: estende uma dívida já catalogada.

#### CR-5 · `CartService.imagePath` repete o helper de `ProductService` (conhecido)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:212-214` (original em `ProductService.java:316`)
- Evidência: o mesmo `linkTo(methodOn(ProductController.class).findImage(id)).toUri().getPath()` aparece nos dois services.
- Correção sugerida: extrair para um helper compartilhado quando surgir um terceiro uso. Esforço pequeno.
- Se nada for feito: Prós: três linhas, sem acoplamento entre services. · Contras: se a rota da imagem mudar, são dois pontos a manter.

#### CR-6 · `setScale(2)` sem `RoundingMode.HALF_UP`
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:180` e `:206`
- Evidência: o código chama `setScale(MONEY_SCALE)` sem arredondamento; `backend/02` pede `HALF_UP`. Um preço com mais de duas casas lançaria `ArithmeticException` (500); hoje a coluna `decimal(65,2)` impede isso.
- Correção sugerida: `setScale(MONEY_SCALE, RoundingMode.HALF_UP)`. Esforço pequeno.
- Se nada for feito: Prós: a coluna garante a escala 2. · Contras: a proteção fica implícita no schema, não no código.

#### CR-7 · O 400 do token tem dois formatos de corpo e o Swagger documenta só `ProblemDetail`
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/CartControllerDocs.java:30-31`, `:44-45`, `:59-60`, `:77-78`, `:96-97` e `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:118-123`
- Evidência: header ausente vira 400 `application/problem+json` (`CartControllerErrorsJsonTest.java:48-53`); token que não é UUID vira 400 `ExceptionResponse` (`{message, details, timestamp}`, `CartControllerErrorsJsonTest.java:75-80`). Todas as operações documentam o 400 só com `ProblemDetail`. `backend/04` pede o status e os corpos reais no Swagger.
- Correção sugerida: documentar os dois corpos no 400 (dois `@Content` ou exemplos), ou padronizar o token inválido como `ProblemDetail` e ajustar `CartControllerErrorsJsonTest`. Esforço pequeno.
- Se nada for feito: Prós: o front já normaliza os dois formatos em `ApiError` (`httpClient.ts:39`). · Contras: quem consome a API pelo Swagger espera um formato que o token inválido nunca devolve.

#### CR-8 · Concorrência na primeira escrita ou na soma pode dar 500 ou duplicar a linha
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:66-82`
- Evidência: dois `POST` simultâneos de um token novo podem criar o carrinho duas vezes; a segunda gravação viola `uk_carts_token` e cai no catch-all com 500. Para um carrinho existente, dois `POST` simultâneos do mesmo produto podem não ver o item um do outro e gerar duas linhas (não há índice único, por desenho de `backend/03`), o que quebra RN-4 e a checagem de estoque da soma. O registro do backend traz isso só em "Observações".
- Correção sugerida: tratar `DataIntegrityViolationException` na criação (reler o carrinho e repetir) ou decidir no agente de segurança/performance. Esforço médio.
- Se nada for feito: Prós: a janela é mínima e o front desabilita o botão enquanto adiciona. · Contras: erro 5xx por ação legítima do cliente e possível linha duplicada.

#### CR-9 · O `QuantityStepper` do carrinho continua ativo durante uma mutação pendente
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/components/feature/Cart/Cart.tsx:87-92` (componente em `components/ui/molecules/QuantityStepper/QuantityStepper.tsx:11`)
- Evidência: remover e "Clear cart" usam `disabled={busy}`; o stepper não tem prop `disabled`. Dois cliques rápidos em "+" enviam dois `PUT` com o mesmo `item.quantity + 1`, e o segundo clique se perde.
- Correção sugerida: adicionar a prop `disabled` ao `QuantityStepper` e passar `busy` (mexe em `components/ui`, coordenar). Esforço pequeno.
- Se nada for feito: Prós: o back recebe um valor absoluto, sem dado errado. · Contras: o clique extra some e o controle destoa dos outros da linha.

#### CR-10 · `Toast` usa a largura fixa `360px`, que não é token
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/components/ui/molecules/Toast/Toast.module.css:9`
- Evidência: `max-width: 360px;` enquanto cores e espaçamentos usam tokens; o `z-index: 1000` repete o de `Modal.module.css:9`.
- Correção sugerida: registrar a largura no guardrail (`SKILL.md`, entrada do `Toast`) ou derivá-la de um token existente. Esforço pequeno.
- Se nada for feito: Prós: componente novo, sem equivalente no MultiShop, e o valor é razoável. · Contras: um valor de design fica fora dos tokens e do guardrail.

#### CR-11 · O `@Scheduled` de hora em hora roda durante os testes de integração
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/test/resources/application.yml:6-7`
- Evidência: o yml de teste usa `cron: "0 0 * * * *"`; `CartLifecycleJsonTest.everyWriteRenewsTheInactivityClockButAReadDoesNot` envelhece um carrinho em 3 dias e depois faz `PUT`; se o cron disparar nesse intervalo o carrinho some e o `PUT` responde 404 (teste intermitente na virada da hora).
- Correção sugerida: no yml de teste, `cron: "-"` (desliga o cron no Spring); os testes já chamam `removeAbandoned()` direto. Esforço pequeno.
- Se nada for feito: Prós: a janela é de milissegundos por hora. · Contras: um teste pode falhar de forma não determinística.

**Resumo:**
- Por severidade: alta 0 · média 3 (CR-1, CR-3, CR-7) · baixa 8 (CR-2, CR-4, CR-5, CR-6, CR-8, CR-9, CR-10, CR-11).
- Por veredito: precisa corrigir 2 (CR-1, CR-7) · tolerável 9.
- Por classe: CR-4 e CR-5 são `conhecido` (registrados na etapa de backend); os demais são novos. TD-1 segue `Corrigido`, sem novo achado.
- Nenhum RN ou AC quebrado no back. No front, CR-1 deixa RN-17/AC-16 parcial no Checkout. Nada do "Fora do escopo" foi implementado.

### Performance

Executado em 26/10/2026 23:52 pelo agente `erudio:perf-reviewer` (somente leitura, sem rodar a aplicação nem medir). Escopo: migrations V6 e V7, 15 classes e arquivos do backend, 22 arquivos do frontend.

**Escopo analisado:** a história inteira (incluindo CR-1 a CR-11 e TD-1); specs lidos por busca dirigida (`frontend/02` linha 54, `frontend/03` linha 73, `frontend/04`, `frontend/05`, `backend/03` linha 57), não por inteiro; backend: `V6`, `V7`, `application.yml`, `Cart`, `CartItem`, `CartRepository`, `CartService`, `CartCleanupService`, `SchedulingConfig`, `CartController`, início de `CartDTO` e `CartItemDTO`, e como contexto `Product`, trechos de `ProductRepository` e `ProductService`; não foram abertos `CartStatus`, `CartControllerDocs`, os DTOs de entrada e `FieldValidationException` (enum, documentação e DTOs, sem consulta); frontend: `cart.ts`, `httpClient.ts`, `queryKeys.ts`, `models/cart.ts`, `uuid.ts`, `providers.tsx`, as duas stores, os sete hooks, `Toast`, `QuantityStepper`, `Cart`, `Checkout`, `Header`, `ProductCard`, `ProductDetails`, `ProductDetail` e `app/(dashboard)/layout.tsx`.

**Backend: fetch e N+1:** checado, sem achados. `findWithItemsByToken` traz carrinho, itens e produtos em uma consulta; `toDto`/`toItemDto` só usam campos de `Product` já carregados, que não tem associações; o BLOB fica fora (`Product` só mapeia `image_content_type` e `image_size`); associações `LAZY` e todo acesso dentro de `@Transactional` com `open-in-view: false`.

**Backend: paginação, filtros e ordenação:** checado, sem achados. Não há listagem; o carrinho é um recurso único e `@OrderBy("id ASC")` ordena só as linhas de um carrinho.

**Backend: índices e migrations:** checado, sem achados. `uk_carts_token` cobre a busca por token; `idx_carts_status_updated_at (status, updated_at)` cobre o predicado da limpeza; `idx_cart_items_cart_id` cobre o join e a cascata do carrinho; `idx_cart_items_product_id` cobre a cascata na exclusão do produto; não há `LIKE` nem função sobre coluna indexada.

**Backend: dados pesados e consultas:** PF-1, PF-2 e PF-3. Também checado: transações curtas e sem chamadas externas, `find` é `readOnly`, o estoque só é verificado (sem leitura-modificação-escrita) e a concorrência na soma já é CR-8.

**Frontend: dados:** PF-4. Também checado: `cartKeys.all` estável e mutações invalidando só `['cart']`; `Header`, `Cart` e `Checkout` compartilham a mesma query (o TanStack deduplica); o `Header` fica em `app/(dashboard)/layout.tsx`, que persiste nas navegações, e o `GET` acontece no carregamento da página e ao montar um novo observador (`/cart`, `/checkout`), aceitável para manter preço e estoque frescos; o interceptor lê o token por `getState()`, sem assinatura.

**Frontend: renderização e bundle:** checado, sem achados. Chaves estáveis, `isPending` isolado por card, seletores estreitos em `useToast`/`useToasts`, um timer por mensagem do Toast com `clearTimeout`, nenhuma dependência nova e UUID com `crypto` nativo.

#### PF-1 · A limpeza apaga todos os carrinhos abandonados em um único `DELETE` sem limite
- Severidade: média
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/repositories/CartRepository.java:24-26` e `geek-shopping-api/src/main/java/br/com/erudio/services/CartCleanupService.java:28-34`
- Evidência: `DELETE FROM Cart c WHERE c.status = :status AND c.updatedAt < :limit` roda em uma transação só e o `ON DELETE CASCADE` de `fk_cart_items_cart` (`V7:11-12`) apaga os itens linha a linha no mesmo comando. Qualquer `POST /items` com um UUID novo cria um carrinho, sem login nem limite, então o volume por hora cresce com o tráfego anônimo (bots e crawlers) e o comando segura locks e undo log proporcionais a ele. O `@Scheduled` roda em todas as instâncias; o resultado é idempotente, mas duas instâncias disputam o mesmo intervalo do índice.
- Correção sugerida: apagar em lotes, com um laço de `DELETE ... ORDER BY updated_at LIMIT 1000` nativo até retornar 0, cada lote em sua transação; com várias instâncias, usar um lock distribuído (por exemplo ShedLock) ou deixar a tarefa em uma só. Esforço médio.
- Se nada for feito: Prós: o volume atual é de desenvolvimento, o índice está correto e o comando é simples e testado (`CartLifecycleJsonTest`). · Contras: em produção com tráfego anônimo, a execução de hora em hora pode virar uma transação longa que disputa locks com as escritas do carrinho.

#### PF-2 · `DISTINCT` desnecessário no fetch join
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/repositories/CartRepository.java:17`
- Evidência: o Hibernate 6 e posteriores já removem em memória as raízes duplicadas de um fetch de coleção; o `DISTINCT` do JPQL segue para o SQL e obriga o MySQL a deduplicar sobre todas as colunas de `carts`, `cart_items` e `products`.
- Correção sugerida: remover o `DISTINCT`; `CartRepositoryTest` confirma que o resultado não muda. Esforço pequeno.
- Se nada for feito: Prós: poucas linhas por carrinho, custo desprezível. · Contras: trabalho extra no banco em toda leitura e escrita do carrinho, o caminho mais frequente.

#### PF-3 · `DELETE` de item e "esvaziar" montam um DTO descartado e apagam item a item
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:104`, `:113-114` e `:173-176`
- Evidência: `removeItem` e `clear` chamam `save`, que monta o `CartDTO` completo com `toDto` (até 3 `linkTo(methodOn(...))` por item) e o controller devolve 204 e descarta o resultado. Em `clear`, `getItems().clear()` com `orphanRemoval` gera um `DELETE` por item (em lotes de 15 por `jdbc.batch_size`) em vez de um `DELETE FROM cart_items WHERE cart_id = ?`.
- Correção sugerida: separar um `touch(cart)` (só `updatedAt` e `flush`, sem DTO) para as operações 204; em `clear`, opcionalmente um `@Modifying` em lote mais a atualização de `updated_at`. Esforço pequeno.
- Se nada for feito: Prós: carrinhos têm poucas linhas e o código fica uniforme. · Contras: CPU e alocação gastas em toda remoção, e N comandos ao esvaziar.

#### PF-4 · Toda adição ou alteração faz duas requisições, porque a resposta da mutação é descartada
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/hooks/useAddToCart/useAddToCart.ts:12-13`, `geek-shopping-app/hooks/useUpdateCartItem/useUpdateCartItem.ts:10` (contrato em `geek-shopping-app/app/core/api/cart.ts:57-65`)
- Evidência: `POST` e `PUT` já devolvem o `Cart` completo e mapeado, mas o `onSuccess` só chama `invalidateQueries(['cart'])`, o que dispara mais um `GET` (o fetch join e o `toDto` rodam de novo no back). No `/cart`, cada clique no `QuantityStepper` (`Cart.tsx:87-92`, sem debounce nem `disabled`, já em CR-9) gera `PUT` mais `GET`.
- Correção sugerida: no `onSuccess` de add e update, usar `queryClient.setQueryData(cartKeys.all, data)`; para manter a letra de RN-14 e de `frontend/03` ("invalidam `['cart']`"), invalidar com `refetchType: 'none'`. Esforço pequeno.
- Se nada for feito: Prós: segue RN-14 ao pé da letra, o dado é sempre o do servidor e o custo é constante. · Contras: o dobro de viagens e de consultas por escrita, e o contador do Header só atualiza depois do segundo pedido.

**Não verificado (precisa de medição):**
- Se o SQL gerado pelo Hibernate 7 deste projeto mantém o `DISTINCT` (PF-2): confirmar com `show-sql` ou no log do `CartRepositoryTest`.
- Tempo e locks do `DELETE` de limpeza com volume real (PF-1): precisa de massa de dados e `EXPLAIN ANALYZE`.
- Se `GET /api/product/v1/{id}/image` envia `Cache-Control`/`ETag`, que decide se as miniaturas do carrinho voltam ao banco a cada visita (endpoint do catálogo, fora do escopo).
- Custo de CPU de `linkTo(methodOn(...))` por item na serialização HAL: precisaria de um profiler; a estimativa é desprezível para carrinhos pequenos.
- O número real de requisições por página no navegador (aba Network); a análise vem só da leitura do código.

**Resumo:**
- Por severidade: alta 0 · média 1 (PF-1) · baixa 3 (PF-2, PF-3, PF-4).
- Por veredito: precisa corrigir 0 · tolerável 4.
- Relação com achados anteriores: PF-4 traz o ângulo de performance de CR-9 (cada clique no stepper gera `PUT` mais `GET`) sem repeti-lo; CR-8 é `conhecido`, sem ângulo novo; nenhum dos débitos catalogados piora.

### Segurança

Executado em 26/10/2026 23:56 pelo agente `erudio:security-reviewer` (somente leitura; nenhum valor de segredo é registrado aqui). Escopo: migrations V6 e V7, 16 arquivos do backend, 21 arquivos do frontend, `next.config.ts`, os `application.yml` (só as chaves) e os nomes dos arquivos `.env*`. Alguns números de linha do relatório original foram corrigidos na conferência do código (`CartControllerDocs.java:69` e `:89` para os `@Valid`; `WebConfig.java:18-20` para as origens; `CartCleanupService.java:30-33` para a limpeza).

**Escopo analisado:** a história inteira (incluindo TD-1, CR-1..CR-11 e PF-1..PF-4); specs só por busca dirigida (`backend/04:10` e `:120`, `frontend/04:24`, `frontend/03:12`, `backend/05:28`, READMEs), não por inteiro; backend: `CartService`, `CartCleanupService`, `CartRepository`, `CartController`, `CartControllerDocs`, os dois DTOs de entrada, `Cart`, `CartItem`, `CartStatus`, `CustomEntityResponseHandler`, `FieldValidationException`, `WebConfig`, `SchedulingConfig`, `V6` e `V7`, os campos de `CartDTO` e `CartItemDTO` e as chaves (sem os valores das credenciais) dos dois `application.yml`; frontend: `httpClient.ts`, `cart.ts`, `models/cart.ts`, `uuid.ts`, `errorMessage.ts`, as duas stores, os sete hooks, `Toast.tsx`, `Cart.tsx`, `next.config.ts`, e só o diff de `Checkout`, `ProductDetail`, `ProductCard` e `ProductDetails`; `.env.example` e `.env.local` só pelo nome (o `.env.local` não é versionado).

**Validação e mass assignment:** checado, sem achados. `@Valid` só na interface; `productId` `@NotNull @Positive`; `quantity` `@NotNull @Min(1)`; `color` e `size` com `@Size` iguais às colunas; a soma é feita em `long` antes do cast (sem estouro); os DTOs de entrada não têm preço, total, `status`, `id` nem `customerId`; há no máximo uma linha por produto (fora a corrida de CR-8); a resposta não devolve o token.

**Injeção:** checado, sem achados. As duas `@Query` usam só parâmetros nomeados; não há SQL nativo nem ordenação vinda da entrada.

**Tratamento de erros e vazamento:** SEC-1. Também checado: o catch-all devolve mensagem genérica; `details` traz só `uri=...`; item inexistente e item de outro carrinho dão o mesmo 404 com a mesma mensagem; "Only N units are available" mostra um estoque que já é público.

**CORS e transporte:** checado, sem achados. Origens vindas de `cors.originPatterns` (`WebConfig.java:18-20`), só `:8080` e `:3000`; headers permitidos no padrão do Spring, o que é intencional (`backend/04:120`); `X-Cart-Token` não está em `exposedHeaders` e não volta na resposta; no front o token vai só em header, nunca em URL; `Referrer-Policy: strict-origin-when-cross-origin` já está no `next.config.ts`.

**Upload:** não se aplica (a história não adiciona endpoint de arquivo).

**Segredos:** checado, sem achados. A história só acrescentou `cart.cleanup.inactivity` e `cart.cleanup.cron`; as credenciais de `spring.datasource` em `application.yml:14-16` (`[valor omitido]`) são o débito já conhecido de `backend/07`; não há segredo em `NEXT_PUBLIC_*` (só `NEXT_PUBLIC_API_URL`).

**Regras de negócio que podem ser contornadas:** SEC-2, SEC-3 e SEC-4. Nenhuma adulteração de preço ou total: preço, subtotal e total são calculados no servidor a partir de `Product`, e `total = subtotal`; toda escrita chama `ensureOpen`, então o carrinho `CONVERTED` está protegido; produto esgotado é recusado; não há IDOR em `PUT` ou `DELETE /items/{itemId}` (o item é procurado só entre os itens do carrinho do token).

**Exposição no frontend:** checado, sem achados. Sem `dangerouslySetInnerHTML`; `Toast` e `InlineAlert` renderizam texto com o escape do React; o `localStorage` guarda só `{ token }`; o interceptor só injeta o header em URLs que começam com `/api/cart`; o `Checkout` não persiste o formulário; nenhuma dependência foi adicionada.

#### SEC-1 · O token do carrinho pode ir para o log quando a criação concorrente viola `uk_carts_token`
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/exception/handler/CustomEntityResponseHandler.java:77` (origem em `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:66`)
- Evidência: dois `POST /items` simultâneos de um token novo criam o carrinho duas vezes; a segunda gravação viola a chave única `uk_carts_token` (`V6__Create_Table_Carts.sql:9`). A mensagem de chave duplicada do MySQL inclui o valor da chave, ou seja, o token, e vai para o log pelo `logger.error("Unexpected error", ex)` do catch-all e pelo log de erro SQL do Hibernate. Contraria RN-13 e `frontend/04:24` ("nunca aparece em URL nem em log"). Ângulo novo sobre CR-8.
- Cenário: (1) duplo clique em "Add to Cart" de um card e do quick view, ou dois POSTs paralelos de um script; (2) a resposta é 500 e o token completo fica gravado no log; (3) quem lê os logs passa a poder ler e alterar aquele carrinho com `X-Cart-Token`. Hoje o carrinho não tem dados pessoais; o dano pode crescer quando o checkout usar o mesmo token.
- Correção sugerida: tratar `DataIntegrityViolationException` na criação do carrinho (reler pelo token e repetir), como CR-8 já sugere; se não der agora, filtrar a mensagem antes de registrar. Esforço pequeno a médio.
- Se nada for feito: Prós: precisa de corrida, de acesso aos logs e de carrinhos que hoje não têm dado sensível. · Contras: uma credencial vai para o log, contra uma regra escrita da história, e o risco aumenta quando checkout e pedido usarem o mesmo token.

#### SEC-2 · O servidor aceita qualquer UUID, inclusive formas curtas e de baixa entropia, como credencial
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:120`
- Evidência: `UUID.fromString(token.trim()).toString()` aceita formas abreviadas (`1-1-1-1-1` vira `00000001-0001-0001-0001-000000000001`), o UUID nulo e UUIDs de qualquer versão. O front gera v4 com fonte segura (`geek-shopping-app/app/core/utils/uuid.ts:5-11`), então a entropia do token do app é adequada (122 bits) e enumerar tokens não é viável.
- Cenário: (1) um cliente que não é o app (integração, script ou app futuro com bug) usa um token previsível, como o UUID nulo ou `1-1-1-1-1`; (2) qualquer pessoa que tente o mesmo valor lê, altera e esvazia aquele carrinho; (3) vários clientes com o mesmo valor fixo compartilham um único carrinho. O dano fica restrito a quem escolheu o token fraco.
- Correção sugerida: aceitar só a forma canônica de 36 caracteres e exigir versão 4 (`uuid.version() == 4`), recusando com o mesmo 400 de token inválido, e cobrir o UUID nulo e a forma curta em `CartControllerErrorsJsonTest`. Vale fazer antes do pedido. Esforço pequeno.
- Se nada for feito: Prós: o app oficial sempre gera v4 aleatório e o risco cai sobre quem escolheu o token. · Contras: o servidor não garante o que a história assume ("o token é a única credencial") e aceita credenciais triviais.

#### SEC-3 · Linhas duplicadas por concorrência deixam a soma de um produto passar do estoque (conhecido, CR-8; ângulo para o pedido)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:68-81` e `:92`
- Evidência: o estoque é verificado por linha. Dois `POST` simultâneos do mesmo produto podem criar duas linhas, cada uma dentro do estoque (CR-8); depois disso, `PUT` em cada linha valida só a própria quantidade contra o estoque (`:92`), sem somar as outras linhas do mesmo produto.
- Cenário: (1) o produto tem 5 em estoque; (2) o cliente dispara dois `POST` paralelos com `quantity: 5` (linhas A e B), ou dois `POST` de 1 e depois `PUT` de 5 em cada linha; (3) o carrinho mostra 10 unidades de um produto com estoque 5, com `subtotal` coerente com as 10; (4) o preço não é adulterado, mas RN-3/RN-4 ("a soma também respeita o estoque") cai, e se o pedido confiar no carrinho e validar o estoque por linha, pode vender mais do que há.
- Correção sugerida: tolerar nesta história (o estoque não é reservado, `## Riscos`) e registrar que o pedido (entrega 5) deve agregar as quantidades por `productId` entre todas as linhas antes do update condicional de estoque; para fechar aqui, um lock pessimista no carrinho (`SELECT ... FOR UPDATE` por token) em `addItem` e `updateItem`. Esforço médio.
- Se nada for feito: Prós: exige corrida deliberada e a garantia final é do pedido. · Contras: o carrinho passa a mostrar quantidades impossíveis e o pedido precisa saber disso.

#### SEC-4 · Qualquer cliente anônimo cria carrinhos sem limite, com UUIDs novos (conhecido, PF-1; ângulo de abuso)
- Severidade: média
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:66` e `:126-134`; limpeza em `geek-shopping-api/src/main/java/br/com/erudio/services/CartCleanupService.java:30-33`
- Evidência: um `POST /items` com qualquer UUID novo e um produto com estoque cria uma linha em `carts` e outra em `cart_items`. Não há limite de taxa, cota por IP nem teto global; os dados só saem depois de 1 dia, num `DELETE` único (PF-1).
- Cenário: (1) um script anônimo envia milhões de `POST /api/cart/v1/items`, cada um com um `X-Cart-Token` aleatório e o mesmo `productId`; (2) `carts` e `cart_items` crescem sem limite durante 24 h; (3) a limpeza da hora seguinte vira uma transação gigante que disputa locks com os carrinhos legítimos (PF-1), e os clientes reais veem lentidão ou erro.
- Correção sugerida: limitar a taxa de criação de carrinho por IP (filtro com Bucket4j, ou no proxy ou gateway na publicação) e aplicar o lote de PF-1; opcionalmente um limite de inatividade menor para carrinhos que nunca foram lidos de novo. Registrar como pré-requisito de produção, junto com a decisão de login. Esforço médio.
- Se nada for feito: Prós: ambiente de curso e desenvolvimento, sem exposição pública, e endpoints abertos por decisão. · Contras: em produção, qualquer anônimo enche o banco e degrada o carrinho de todos.

**Não verificado:**
- Se o log de erro SQL do Hibernate 7 e o Connector/J incluem mesmo o valor da chave duplicada (SEC-1): pela documentação do MySQL sim, mas nada foi executado.
- Limites de tamanho do corpo JSON e as `StreamReadConstraints` do Jackson (um `color` de vários MB é parseado antes de o `@Size` recusar): comportamento geral da API, não desta história.
- Se os links HATEOAS absolutos aceitam `Host` ou `X-Forwarded-*` forjados: padrão do projeto, anterior a esta história, e o front não os usa.
- Os specs `backend/02`, `03`, `07` e `frontend/02`, `07` não foram lidos por inteiro; os arquivos de teste só como evidência relatada na história.

**Resumo:**
- Por severidade: alta 0 · média 1 (SEC-4) · baixa 3 (SEC-1, SEC-2, SEC-3).
- Por veredito: precisa corrigir 0 · tolerável 4.
- Por classe: SEC-1 é ângulo novo sobre CR-8 (token em log); SEC-2 é novo; SEC-3 é `conhecido` (CR-8) com ângulo para o pedido; SEC-4 é `conhecido` (PF-1) com ângulo de abuso por anônimos.
- Nenhum achado permite adulterar preço ou total nem expõe segredo, então não há marca `[segurança]`.

### Tech debt

Varredura final executada em 27/10/2026 00:00 pelo agente `erudio:tech-debt-reviewer` (somente leitura; nada foi editado, compilado nem executado). Nada do que já constava em `## Alertas e débitos técnicos` foi repetido (TD-1, CR-1 a CR-11, PF-1 a PF-4, SEC-1 a SEC-4). Os achados novos começam em TD-2.

**Escopo analisado:** backend lido por inteiro (`Cart`, `CartItem`, `CartStatus`, `CartRepository`, `CartService`, `CartCleanupService`, `SchedulingConfig`, `CartController`, trecho inicial de `CartControllerDocs`, os 4 DTOs, `FieldValidationException`, o diff de `CustomEntityResponseHandler`, os dois `application.yml`, `V6` e `V7`); testes do backend: `CartApi`, `MockCart`, `CartCleanupServiceTest` e os setups das três classes de integração, `CartServiceTest` até a linha 120, o restante só por busca de padrões (`@Disabled`, `sleep`, `TODO`); frontend lido por inteiro (modelos, `cart.ts`, `httpClient.ts`, `queryKeys.ts`, `uuid.ts`, `errorMessage.ts`, as duas stores, os 7 hooks, `Toast`, `Cart.tsx`, `Cart.module.css`, `Checkout.tsx`, `ProductCard`, `ProductDetails`, trecho de `ProductDetail`, o layout, `serveCart.ts`, diff de `fixtures.ts` e `handlers.ts`, `e2e/cart.spec.ts`, início de `useCart.test.tsx`); demais testes do front só por busca de padrões; documentos comparados: `CLAUDE.md` (raiz, API e app), `README.md` e `ARCHITECTURE.md` do app, specs `backend/01, 03, 05` e `frontend/02, 03, 04, 07`.

**Remoção de `useCartStore.ts`:** nenhum `.ts`, `.tsx` ou `.css` o referencia; restam menções só em documentos (`geek-shopping-app/ARCHITECTURE.md:58` e `:119`, `docs/specs/frontend/04-ui-estado-e-design-system.md:7`, `07-alinhamento-do-app-atual.md` B7), tratadas em TD-2 e TD-3.

**Duplicação e código morto:** TD-6, TD-9 e TD-10. Todas as classes de `Cart.module.css` são usadas; `cartKeys`, `useCartCount`, `NO_ITEMS`, `generateUuid`, `holdAddRequests` e `buildCartItemResponse` têm uso real; `Cart.customerId` e `CartStatus.CONVERTED` não são escritos por código de produção por desenho (a conversão virá com o pedido).
**Acoplamento e camadas:** TD-8. `httpClient.ts` importar `useCartTokenStore` está de acordo com `frontend/03:12`; não há React em `core`; a cadeia `Controller → Service → Repository` está correta.
**Violações de spec e documentação desatualizada:** TD-2, TD-3, TD-4 e TD-5.
**Marcadores e hacks permanentes:** checado, sem achados. Sem `TODO`/`FIXME`/`HACK`/`XXX`; as URLs nos testes vêm de `API_URL`/`TestConfigs`; o único default é `E2E_API_URL ?? 'http://localhost:8080'` (padrão já existente em `e2e/catalog.spec.ts:3`).
**Tratamento de erros:** checado, sem achados novos. Os `catch` vazios de `safeLocalStorage` (`useCartTokenStore.ts:9,17,24`) são o fallback deliberado de TD-1; sem `printStackTrace`, `catch (Exception)` nem retorno `null` em exceção. Sem `localStorage`, o token vive só em memória e o carrinho some ao recarregar, sem aviso: efeito de TD-1, tolerável.
**Valores mágicos e configuração:** TD-7. No frontend, `'X-Cart-Token'`, `'/api/cart'`, `'geek-shopping-cart-token'` e `AUTO_DISMISS_MS` são constantes nomeadas; `retry: 1` e os valores em px do `Cart.module.css` são menores, sem achado; a `max-width: 360px` do Toast é o CR-10.
**Dependências:** checado, sem achados. Nem `package.json` nem `pom.xml` foram alterados; o UUID usa `crypto` nativo.
**Testes:** TD-11. Sem `@Disabled`, `it.skip`, `.only`, `Thread.sleep`, `printStackTrace` ou `TODO` nos testes de carrinho; os `beforeEach` reiniciam `localStorage`, o token e o toast store, sem estado compartilhado; o `Toast.test.tsx` usa relógio falso (determinístico) e fixa 3999/4000 ms; os `setTimeout(…, 50)` em `Header.test.tsx:59` e `ProductDetail.test.tsx:91` são anteriores à história.

#### TD-2 · README e ARCHITECTURE do app ainda descrevem carrinho local e modo mock
- Severidade: média
- Veredito: precisa corrigir
- Classe: novo
- Local: `geek-shopping-app/ARCHITECTURE.md:24,27,38,58,119,136` e `geek-shopping-app/README.md:35,64`
- Evidência: `ARCHITECTURE.md:27` diz que `app/store/modules/cart/useCartStore.ts` começa pré-semeado com itens mock (arquivo removido); `:58` e `:119` listam `useCartStore`; `:24,38,136` e `README.md:35` descrevem `USE_MOCK_PRODUCT_DATA = true`; `README.md:64` diz que `/cart` tem "coupon field" e vem "Pre-seeded". O `geek-shopping-app/CLAUDE.md:55` afirma que não existe modo mock, o que contradiz esses dois arquivos (a flag mock já estava defasada desde o estágio anterior).
- Correção sugerida: reescrever as seções de carrinho e de mock do `ARCHITECTURE.md` e a linha de `/cart` do `README.md`, documentando `useCartTokenStore`, `useToastStore`, o interceptor e a API `/api/cart/v1`. Esforço pequeno a médio.
- Se nada for feito: Prós: nenhum risco de runtime. · Contras: documentação que conduz a erro (aponta para um arquivo inexistente) para quem estuda o estágio.

#### TD-3 · Specs divergem do código entregue (`color_id`/`size_id` e "carrinho no Zustand")
- Severidade: baixa
- Veredito: precisa corrigir
- Classe: novo
- Local: `docs/specs/backend/03-modelo-de-dados-e-migracoes.md:33,57`, `docs/specs/frontend/04-ui-estado-e-design-system.md:7`
- Evidência: `backend/03:33` e `:57` falam em `color_id`/`size_id` e unicidade `(cart_id, product_id, color_id, size_id)`; `V7__Create_Table_Cart_Items.sql:6-7` tem `color varchar(50)` e `size varchar(20)`, e o service compara textos (`CartService.java:150-152`). `frontend/04:7` diz que o carrinho está no Zustand e "passa para o servidor", o que já aconteceu.
- Correção sugerida: atualizar as duas specs para o desenho real (cor e tamanho como texto copiado do produto). Esforço pequeno.
- Se nada for feito: Prós: nenhum. · Contras: a próxima história (pedido) pode assumir `color_id` e criar FK ou migration conflitante.

#### TD-4 · Os `CLAUDE.md` da raiz e da API estão defasados
- Severidade: baixa
- Veredito: precisa corrigir
- Classe: novo
- Local: `CLAUDE.md` (seção do app: "the cart is still local"; seção da API: "V1–V5 today"), `geek-shopping-api/CLAUDE.md:17,21`
- Evidência: o da raiz diz que o carrinho ainda é local (Zustand) e que as migrations vão até a V5 (existem V6 e V7); o da API diz "Single domain (`Product`)" e "(one domain)", mas agora existem `Cart`, `CartItem`, `CartService`, `CartCleanupService`, `SchedulingConfig` e `FieldValidationException`. O `CLAUDE.md` do app já foi atualizado (`:62`).
- Correção sugerida: atualizar essas frases e a listagem de classes. Esforço pequeno.
- Se nada for feito: Prós: nenhum. · Contras: o assistente e quem chega ao projeto recebem premissas erradas.

#### TD-5 · Checkout mostra "Order placed!" mesmo se esvaziar o carrinho falhar
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/components/feature/Checkout/Checkout.tsx:36-40`
- Evidência: `handleSubmit` chama `setOrderPlaced(true)` e logo `clearCart.mutate()`, sem esperar o resultado; se o `DELETE` falhar, a tela confirma o pedido e o carrinho continua cheio (só aparece o toast de erro de `useClearCart`). Distinto de CR-1, que trata de `isError` na leitura.
- Correção sugerida: `clearCart.mutate(undefined, { onSuccess: () => setOrderPlaced(true) })`. Esforço pequeno.
- Se nada for feito: Prós: é checkout simulado e o toast avisa. · Contras: confirmação enganosa se o pedido real herdar este fluxo.

#### TD-6 · Boilerplate repetido nos hooks de mutação, com tratamento de erro inconsistente
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/hooks/useRemoveCartItem/useRemoveCartItem.ts:7-15`, `useClearCart/useClearCart.ts:7-15`, `useUpdateCartItem/useUpdateCartItem.ts:5-12`, `useAddToCart/useAddToCart.ts:7-23`
- Evidência: os 4 hooks repetem `useQueryClient` e `invalidateQueries({ queryKey: cartKeys.all })`; três repetem `onError: show('error', getErrorMessage(error))`; `useUpdateCartItem` não tem `onError` (o erro aparece inline em `Cart.tsx:55`), então remover e esvaziar avisam por toast e atualizar avisa por alerta inline.
- Correção sugerida: extrair um `useCartMutation(fn, { notifyError })` ou um helper `invalidateCart` e documentar por que o update é inline. Esforço pequeno.
- Se nada for feito: Prós: hooks pequenos e legíveis. · Contras: uma regra nova (por exemplo, atualização otimista) precisa ser copiada 4 vezes.

#### TD-7 · Literais repetidos no backend e defaults duplicados da limpeza
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/CartController.java:34,40,51,62,71`, `controllers/docs/CartControllerDocs.java` (4 ocorrências), `services/CartService.java:63,118,122,138,145`, `services/CartCleanupService.java:25,28`
- Evidência: `"X-Cart-Token"` aparece 5 vezes no controller, 4 nas docs e 2 em mensagens do service; `"No records found for this ID!"` está 3 vezes no `CartService`; os defaults `1d` e `0 0 * * * *` estão no `@Value` (`CartCleanupService.java:25,28`), de novo em `application.yml:2-5` e em `src/test/resources/application.yml:4-7` (duas fontes da mesma configuração).
- Correção sugerida: constante `CartController.TOKEN_HEADER` e uma constante para a mensagem de não encontrado; manter o default só no yml ou só no `@Value`. Esforço pequeno.
- Se nada for feito: Prós: nenhum risco funcional. · Contras: renomear o header exige 11 edições e o cron pode divergir entre main e test.

#### TD-8 · `ui/molecules/Toast` depende de hook e de tipo do store
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/components/ui/molecules/Toast/Toast.tsx:5-6`
- Evidência: o componente `ui` importa `ToastMessage` de `app/store/modules/global/useToastStore` e os hooks `useToast`/`useToasts`; `frontend/02:35` define `feature → ui / hooks → core / store` e não prevê `ui → hooks`, mas `frontend/04:39` lista "Toast (+ store)" como molécula, então há ambiguidade na spec.
- Correção sugerida: mover o tipo `ToastMessage` para `app/core/models` e fazer o `Toast` receber `toasts` e `onDismiss` por props, com um container no layout; alternativa: registrar a exceção em `frontend/02`. Esforço pequeno.
- Se nada for feito: Prós: o `Toast` funciona e é montado uma vez no layout. · Contras: o `ui` fica acoplado ao store e um teste visual isolado do `Toast` precisa do store.

#### TD-9 · Tom `info` do Toast sem nenhum chamador de produção
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/app/store/modules/global/useToastStore.ts:3`, `geek-shopping-app/components/ui/molecules/Toast/Toast.module.css:33`
- Evidência: `ToastTone` inclui `'info'` e existe a classe `.info`, mas `show('info', ...)` só aparece em `hooks/__test__/useCart.test.tsx:269` e `stores.test.ts:100-101`; a produção usa só `success` e `error`.
- Correção sugerida: manter (é a API mínima de um toast) ou remover o tom e a classe até haver uso. Esforço pequeno.
- Se nada for feito: Prós: o componente fica completo. · Contras: um estilo que nada exercita em produção.

#### TD-10 · Testes do backend: helpers repetidos e acoplamento frágil
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/controllers/withjson/CartControllerErrorsJsonTest.java:40`, `CartLifecycleJsonTest.java` (helper `cartRows`), `geek-shopping-api/src/test/java/br/com/erudio/unittests/services/CartCleanupServiceTest.java:44,60,76`
- Evidência: o helper `cartRows(token)` está copiado idêntico em duas classes; criar e apagar produtos em `@BeforeAll`/`@AfterAll` se repete nas três de integração; `CartCleanupServiceTest` injeta o campo com `ReflectionTestUtils.setField(service, "inactivity", ...)` (depende do nome do campo privado) e compara o limite com janelas de `LocalDateTime.now()`, sem `Clock`; `CartControllerJsonTest` usa `@Order` com estado estático compartilhado, no padrão dos testes ordenados já existentes.
- Correção sugerida: mover `cartRows` para `CartApi` ou para uma base com `JdbcTemplate`; tornar a janela de inatividade injetável no construtor para dispensar `ReflectionTestUtils`. Esforço pequeno.
- Se nada for feito: Prós: os testes passam e a cobertura de RN-10 existe. · Contras: renomear o campo `inactivity` quebra os testes sem aviso do compilador e a janela de tempo é um risco leve de intermitência.

#### TD-11 · E2E de carrinho depende de produtos semeados e deixa carrinhos no banco
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/e2e/cart.spec.ts:3-4`
- Evidência: usa os nomes `'Caneca Super Mario Coffee'` e `'Camiseta'` do seed e a API real em `:8080`; cada teste cria um carrinho com token novo e não limpa (a limpeza agendada apaga depois de 1 dia). Não há `waitForTimeout` nem `skip`; as esperas são por `expect`.
- Correção sugerida: documentar a dependência do seed no topo do spec ou criar o produto pela API em `beforeAll`. Esforço pequeno.
- Se nada for feito: Prós: reflete o ambiente real e segue o padrão de `catalog.spec.ts`. · Contras: um seed alterado quebra o E2E e há acúmulo de carrinhos anônimos em desenvolvimento.

**Resumo:**
- Achados novos: TD-2 a TD-11 (10 no total).
- Por severidade: alta 0 · média 1 (TD-2) · baixa 9 (TD-3 a TD-11).
- Por veredito: precisa corrigir 3 (TD-2, TD-3, TD-4, todos de documentação) · tolerável 7 (TD-5 a TD-11).
- Por classe: novo 10 · conhecido 0.
- Nada de código de produção bloqueia o fechamento; o que vale corrigir antes de fechar é só documentação, e o resto é limpeza opcional.

## Alertas e débitos técnicos

| ID | Origem | Severidade | Veredito | Local | Resumo | Status |
|---|---|---|---|---|---|---|
| TD-1 | Testes de Frontend | média | precisa corrigir | `geek-shopping-app/app/store/modules/cart/useCartTokenStore.ts:34` | `localStorage` que recusa gravar fazia `ensureToken()` lançar no interceptor e quebrava toda chamada do carrinho; corrigido com armazenamento protegido por `try/catch` (autorizado pelo usuário em 26/10/2026 23:33). | Corrigido |
| CR-1 | Code Review | média | precisa corrigir | `geek-shopping-app/components/feature/Checkout/Checkout.tsx:29` | Checkout ignora `isError` e mostra "Your cart is empty" quando a API do carrinho falha; o teste fixa isso e o registro afirma cobertura inexistente (RN-17/AC-16). | Aberto |
| CR-2 | Code Review | baixa | tolerável | `geek-shopping-app/hooks/useAddToCart/useAddToCart.ts:11` | Desvios do plano sem registro: sem facade `useCartToken`, sem cor/tamanho no "Add to Cart", sem `PriceTag` no carrinho, sem `CartItemRepository`, propriedades em `@Value`. | Aberto |
| CR-3 | Code Review | média | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:178` | DTOs montados à mão, sem `DozerMapper`, contra `backend/02` e o `CLAUDE.md` do projeto; justificável pelos campos derivados. | Aberto |
| CR-4 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/model/Cart.java:114` | `equals` em uma linha e sem as associações (conhecido, `backend/07` #17). | Aberto |
| CR-5 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:212` | `imagePath` repete o helper de `ProductService` (conhecido). | Aberto |
| CR-6 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:180` | `setScale(2)` sem `RoundingMode.HALF_UP` (`backend/02`). | Aberto |
| CR-7 | Code Review | média | precisa corrigir | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/CartControllerDocs.java:30` | O 400 do token tem dois corpos (`ProblemDetail` e `ExceptionResponse`) e o Swagger documenta só `ProblemDetail`. | Aberto |
| CR-8 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:66` | Escritas simultâneas podem dar 500 na criação do carrinho ou duplicar a linha do mesmo produto. | Aberto |
| CR-9 | Code Review | baixa | tolerável | `geek-shopping-app/components/feature/Cart/Cart.tsx:87` | `QuantityStepper` segue ativo durante uma mutação pendente; cliques rápidos perdem um incremento. | Aberto |
| CR-10 | Code Review | baixa | tolerável | `geek-shopping-app/components/ui/molecules/Toast/Toast.module.css:9` | `max-width: 360px` do Toast fora dos tokens e do guardrail. | Aberto |
| CR-11 | Code Review | baixa | tolerável | `geek-shopping-api/src/test/resources/application.yml:6` | O cron de hora em hora roda nos testes de integração e pode tornar um teste intermitente; usar `cron: "-"`. | Aberto |
| PF-1 | Performance | média | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/repositories/CartRepository.java:24` | A limpeza apaga todos os carrinhos abandonados em um único `DELETE` sem limite (cascata de itens na mesma transação); em lotes é melhor com tráfego anônimo. | Aberto |
| PF-2 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/repositories/CartRepository.java:17` | `DISTINCT` desnecessário no fetch join; o Hibernate já deduplica as raízes. | Aberto |
| PF-3 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:104` | `removeItem` e `clear` montam um DTO descartado e `clear` apaga item a item. | Aberto |
| PF-4 | Performance | baixa | tolerável | `geek-shopping-app/hooks/useAddToCart/useAddToCart.ts:12` | Add e update descartam a resposta do cart e fazem um `GET` extra por escrita. | Aberto |
| SEC-1 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/exception/handler/CustomEntityResponseHandler.java:77` | Na criação concorrente do carrinho, a violação de `uk_carts_token` pode gravar o token no log (contra RN-13); ângulo novo sobre CR-8. | Aberto |
| SEC-2 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:120` | `UUID.fromString` aceita formas curtas, o UUID nulo e qualquer versão como credencial; exigir forma canônica v4. | Aberto |
| SEC-3 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:68` | Linhas duplicadas por concorrência deixam a soma passar do estoque (conhecido, CR-8); o pedido deve agregar por produto. | Aberto |
| SEC-4 | Segurança | média | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:66` | Anônimos criam carrinhos sem limite de taxa com UUIDs novos (conhecido, PF-1); limitar por IP antes de produção. | Aberto |
| TD-2 | Tech debt | média | precisa corrigir | `geek-shopping-app/ARCHITECTURE.md:27` | README e ARCHITECTURE do app ainda descrevem carrinho local, `useCartStore` removido e modo mock (novo). | Aberto |
| TD-3 | Tech debt | baixa | precisa corrigir | `docs/specs/backend/03-modelo-de-dados-e-migracoes.md:33` | Specs falam em `color_id`/`size_id` e carrinho no Zustand; o código entregue usa cor/tamanho em texto e carrinho no servidor (novo). | Aberto |
| TD-4 | Tech debt | baixa | precisa corrigir | `geek-shopping-api/CLAUDE.md:17` | `CLAUDE.md` da raiz e da API defasados: carrinho local, V1–V5, domínio único (novo). | Aberto |
| TD-5 | Tech debt | baixa | tolerável | `geek-shopping-app/components/feature/Checkout/Checkout.tsx:36` | "Order placed!" aparece mesmo se esvaziar o carrinho falhar (novo). | Aberto |
| TD-6 | Tech debt | baixa | tolerável | `geek-shopping-app/hooks/useRemoveCartItem/useRemoveCartItem.ts:7` | Boilerplate repetido nos 4 hooks de mutação, com tratamento de erro inconsistente (novo). | Aberto |
| TD-7 | Tech debt | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/controllers/CartController.java:34` | Literais repetidos (`X-Cart-Token`, mensagem de não encontrado) e defaults da limpeza em duas fontes (novo). | Aberto |
| TD-8 | Tech debt | baixa | tolerável | `geek-shopping-app/components/ui/molecules/Toast/Toast.tsx:5` | `ui/Toast` depende de hook e de tipo do store (novo). | Aberto |
| TD-9 | Tech debt | baixa | tolerável | `geek-shopping-app/app/store/modules/global/useToastStore.ts:3` | Tom `info` do Toast sem chamador de produção (novo). | Aberto |
| TD-10 | Tech debt | baixa | tolerável | `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/controllers/withjson/CartControllerErrorsJsonTest.java:40` | Testes do backend: helpers repetidos e `ReflectionTestUtils` acoplado ao nome do campo (novo). | Aberto |
| TD-11 | Tech debt | baixa | tolerável | `geek-shopping-app/e2e/cart.spec.ts:3` | E2E depende de produtos semeados e deixa carrinhos no banco (novo). | Aberto |

## Fechamento

Encerrada em 27/10/2026 00:03, por decisão explícita do usuário ("Encerrar a história"). As dez etapas anteriores estão ✅; a varredura de débito técnico (`### Tech debt`) foi registrada em 27/10/2026 00:00. Nenhum achado `alta` está aberto.

### Critérios de aceite

| AC | Evidência | Situação |
|---|---|---|
| AC-1 | `CartControllerErrorsJsonTest` (header ausente em todas as rotas, token que não é UUID em 5 rotas), `CartServiceTest` (`rejectsInvalidToken`) | evidenciado |
| AC-2 | `CartControllerJsonTest` (token novo recebe carrinho vazio), `CartControllerErrorsJsonTest` (leitura e `DELETE` não gravam nada), `CartServiceTest` | evidenciado |
| AC-3 | `CartControllerJsonTest` (adicionar cria o carrinho com preço, `lineTotal` e `stock`), `CartControllerErrorsJsonTest` (primeira escrita cria o carrinho `OPEN`) | evidenciado |
| AC-4 | `CartControllerJsonTest` (soma do mesmo produto), `CartServiceTest` | evidenciado |
| AC-5 | `CartControllerErrorsJsonTest` (quantidade < 1, acima do estoque, esgotado, valores enormes), `CartServiceTest` | evidenciado |
| AC-6 | `CartControllerErrorsJsonTest` (cor/tamanho de outro produto, sem diferença de caixa), `CartServiceTest` | evidenciado |
| AC-7 | `CartControllerJsonTest` (atualizar define, remover), `CartControllerErrorsJsonTest` (404 e isolamento entre tokens) | evidenciado |
| AC-8 | `CartControllerJsonTest` (esvaziar), `CartServiceTest` | evidenciado |
| AC-9 | `CartLifecycleJsonTest` (mudança de preço aparece na leitura seguinte, sem frete nem desconto) | evidenciado |
| AC-10 | `CartLifecycleJsonTest` (`CONVERTED` recusa escritas), `CartServiceTest` | evidenciado |
| AC-11 | `CartLifecycleJsonTest` (limpeza, prazo de 1 dia vindo do `application.yml`), `CartCleanupServiceTest`, `CartRepositoryTest` | evidenciado |
| AC-12 | `CartCorsJsonTest` (leitura, escrita e preflight com `X-Cart-Token` a partir de `http://localhost:3000`) | evidenciado |
| AC-13 | `stores.test.ts` (token gerado uma vez, persistido, `localStorage` indisponível), `httpClient.test.ts` (header em toda chamada `/api/cart`, nunca em URL), `cart.test.ts` | evidenciado |
| AC-14 | `ProductCard.test.tsx`, `Products.test.tsx`, `ProductDetail.test.tsx`, `Header.test.tsx` (contador soma as quantidades; esgotado desabilitado) | evidenciado |
| AC-15 | `Cart.test.tsx` (itens do servidor, quantidade limitada ao estoque, remover, esvaziar, subtotal e total sem frete nem cupom); falta a conferência visual e o `e2e/cart.spec.ts` não foi executado | parcial |
| AC-16 | `Cart.test.tsx` (carregando, vazio, erro com nova tentativa, erro de quantidade inline); no Checkout o erro do carrinho aparece como "carrinho vazio" (CR-1) | parcial |
| AC-17 | Carrinho local e frete fixo removidos (`useCartStore.ts` não existe mais; busca sem referências em código); "recarregar mantém o carrinho" só está no `e2e/cart.spec.ts`, que não foi executado | parcial |

Resumo: 14 evidenciados, 3 parciais, 0 sem evidência.

### Achados e débitos em aberto

Corrigido: TD-1 (`localStorage` que recusa gravar quebrava as chamadas do carrinho; corrigido em 26/10/2026 com a autorização do usuário). Nenhum `Aceito` nem `Contestado`. Abertos: 0 `alta`, 6 `média`, 23 `baixa` (29 no total). Marcados `precisa corrigir`: CR-1, CR-7, TD-2, TD-3, TD-4.

**Média (6)**

| ID | Origem | Local | Veredito | Resumo |
|---|---|---|---|---|
| CR-1 | Code Review | `geek-shopping-app/components/feature/Checkout/Checkout.tsx:29` | precisa corrigir | O Checkout ignora `isError` e mostra "Your cart is empty" se a API do carrinho falhar. |
| CR-3 | Code Review | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:178` | tolerável | DTOs montados à mão, sem `DozerMapper`. |
| CR-7 | Code Review | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/CartControllerDocs.java:30` | precisa corrigir | O 400 do token tem dois corpos e o Swagger documenta só `ProblemDetail`. |
| PF-1 | Performance | `geek-shopping-api/src/main/java/br/com/erudio/repositories/CartRepository.java:24` | tolerável | A limpeza apaga tudo em um `DELETE` sem lote. |
| SEC-4 | Segurança | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:66` | tolerável | Anônimos criam carrinhos sem limite de taxa. |
| TD-2 | Tech debt | `geek-shopping-app/ARCHITECTURE.md:27` | precisa corrigir | README e ARCHITECTURE do app descrevem carrinho local e modo mock. |

**Baixa (23)**

| ID | Origem | Veredito | Resumo |
|---|---|---|---|
| CR-2 | Code Review | tolerável | Itens do plano não seguidos (sem `useCartToken`, sem cor/tamanho no "Add to Cart", sem `PriceTag`, sem `CartItemRepository`). |
| CR-4 | Code Review | tolerável | `equals` em uma linha e sem as associações (conhecido). |
| CR-5 | Code Review | tolerável | `imagePath` repetido de `ProductService` (conhecido). |
| CR-6 | Code Review | tolerável | `setScale(2)` sem `RoundingMode.HALF_UP`. |
| CR-8 | Code Review | tolerável | Escritas simultâneas: 500 na criação do carrinho ou linha duplicada. |
| CR-9 | Code Review | tolerável | `QuantityStepper` ativo durante uma mutação pendente. |
| CR-10 | Code Review | tolerável | `max-width: 360px` do Toast fora dos tokens. |
| CR-11 | Code Review | tolerável | O cron de hora em hora roda nos testes de integração. |
| PF-2 | Performance | tolerável | `DISTINCT` desnecessário no fetch join. |
| PF-3 | Performance | tolerável | `removeItem` e `clear` montam um DTO descartado; `clear` apaga item a item. |
| PF-4 | Performance | tolerável | Add e update fazem um `GET` extra por escrita. |
| SEC-1 | Segurança | tolerável | O token pode ir para o log na criação concorrente do carrinho. |
| SEC-2 | Segurança | tolerável | O servidor aceita qualquer UUID, inclusive formas curtas, como credencial. |
| SEC-3 | Segurança | tolerável | Linhas duplicadas por concorrência passam a soma do estoque (o pedido deve agregar por produto). |
| TD-3 | Tech debt | precisa corrigir | Specs com `color_id`/`size_id` e carrinho no Zustand. |
| TD-4 | Tech debt | precisa corrigir | `CLAUDE.md` da raiz e da API defasados. |
| TD-5 | Tech debt | tolerável | "Order placed!" aparece mesmo se esvaziar o carrinho falhar. |
| TD-6 | Tech debt | tolerável | Boilerplate repetido nos 4 hooks de mutação. |
| TD-7 | Tech debt | tolerável | Literais repetidos e defaults da limpeza em duas fontes. |
| TD-8 | Tech debt | tolerável | `ui/Toast` depende de hook e de tipo do store. |
| TD-9 | Tech debt | tolerável | Tom `info` do Toast sem uso em produção. |
| TD-10 | Tech debt | tolerável | Helpers repetidos e `ReflectionTestUtils` nos testes do backend. |
| TD-11 | Tech debt | tolerável | E2E depende do seed e deixa carrinhos no banco. |

Os locais completos, as evidências e as sugestões de cada achado estão nas seções `### Code Review`, `### Performance`, `### Segurança` e `### Tech debt`.

### Pontos em aberto do plano

Resolvidos com a sugestão do plano durante o backend (registrado em `### Backend`): 1 a 10 e 11 (esqueleto da história `frete-do-carrinho` criado). Continua aberto o ponto 12 (specs a atualizar: `backend/03`, `backend/05`, `frontend/07`), que é o TD-3.

### Lacunas aceitas

- O spec E2E `geek-shopping-app/e2e/cart.spec.ts` (10 testes) e o ajuste em `e2e/catalog.spec.ts` não foram executados: exigem a API em `:8080`, o MySQL e o app em `:3000`. Decisão do usuário em 26/10/2026 (etapa de integração).
- A conferência visual da tela `/cart`, do Toast e do Checkout contra o `MultiShop` está pendente.
- O Playwright de `catalog.spec.ts` já não era executado desde a história anterior.

### Decisões do usuário durante a história

- O frete sai desta história; fica o esqueleto `docs/plans/stories/frete-do-carrinho.md`, pendente.
- O cupom é outra história (entrega 6).
- Limpeza de carrinhos abandonados incluída, com 1 dia de inatividade parametrizado.
- Cor e tamanho guardados no item e exibidos na resposta.
- Os testes do carrinho local foram reescritos já na etapa de frontend (26/10/2026).
- O defeito TD-1 foi corrigido com a autorização do usuário durante os testes do frontend.
- Fechar a etapa de integração com o E2E sem resultado; encerrar a história com os achados acima em aberto.
