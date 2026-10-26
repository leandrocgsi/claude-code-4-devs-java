# 05 — Telas e módulos

Visão em alto nível, na ordem de entrega. Endpoints e modelos em [03](03-dados-e-contrato-com-a-api.md); estado e componentes em [04](04-ui-estado-e-design-system.md); regras de negócio em [`backend/05-modulos.md`](../backend/05-modulos.md). O detalhe fino fica para o plano micro de cada módulo.

## Mapa de rotas

| Rota | Tela | Entrega | Estado hoje |
|---|---|---|---|
| `/` | Home | 2 | existe, em mock |
| `/products` | Shop (listagem com filtros) | 2 | existe, filtros no cliente |
| `/products/[id]` | Detalhe do produto | 2 | **nova** |
| `/cart` | Carrinho | 3 | existe, estado local |
| `/checkout` | Checkout | 4 | existe, demo |
| `/orders/[number]` | Pedido (resumo, cupom, pagamento) | 5, 6, 7 | **nova** |
| `/contact` | Contato | — | demo, fora do escopo |

## Entrega 2 — Home, shop e detalhe

### Home (`/`)
- **Dados:** categorias (`GET /api/category/v1`, com `productCount`), destaques (`GET /featured`), recentes (`GET /recent`).
- **Seções:** hero (Carousel e banners continuam estáticos), selos de benefício (estáticos), grade de categorias, "Featured Products", "Recent Products", faixa de vendors (estática).
- **Regras na tela:** a grade de categorias usa as categorias reais, com contagem vinda do back; produto sem estoque aparece, mas o botão de adicionar ao carrinho fica desabilitado.
- **Estados:** loading, vazio e erro por seção.
- **Saída do mock:** some `core/mocks/categories.ts` e a lista fixa `NAV_CATEGORY_LINKS` do Header (`Header.tsx:11,123`), que hoje traz categorias de moda do template; o menu de categorias do Header passa a usar `GET /api/category/v1`.

### Shop (`/products`)
- **Dados:** `GET /api/product/v1` com filtros; `GET /facets` para as contagens da sidebar; categorias e atributos para os filtros.
- **Controles:** busca (`q`), categoria, faixas de preço, cor, tamanho, ordenação (Latest, Popularity, Best Rating, nome, preço), tamanho de página, modo grid/lista, paginação. Tudo vai para a **URL**; mudar um filtro volta para `page=0`.
- **Regras:** o filtro agora vale para o catálogo inteiro (não só a página atual); "Best Rating" ordena por `rating` e deixa sem nota no fim; `size` no máximo 100; as contagens da sidebar vêm dos facets, não do mock.
- **Card:** imagem, nome, `PriceTag` (com `oldPrice` riscado), `RatingStars` (omitido se `rating` for nulo), ações de hover (carrinho, wishlist, quick view/detalhe). O botão "compare" permanece desabilitado.
- **Quick view:** `Modal` alimentado pelos dados já carregados; link para `/products/[id]`.
- **Estados:** loading, vazio ("nenhum produto encontrado"), erro, 400 por parâmetro inválido (resetar filtros).

### Detalhe (`/products/[id]`)
- **Dados:** `GET /api/product/v1/{id}`.
- **Conteúdo:** imagem, nome, `PriceTag`, `RatingStars` (se houver), descrição, escolha de cor e tamanho (entre as opções do produto), quantidade, "Add to Cart".
- **Regras:** quantidade entre 1 e o estoque; sem estoque, botão desabilitado; cor/tamanho obrigatórios quando o produto os tem.
- **Fora:** avaliações e relacionados.
- **Estados:** loading, 404 ("produto não encontrado"), erro.
- **Visual:** sem equivalente no MultiShop; compor com tokens e componentes existentes (ver [04](04-ui-estado-e-design-system.md)).

## Entrega 3 — Carrinho (`/cart`)

- **Dados:** `GET /api/cart/v1`; mutações em `/api/cart/v1/items`; `X-Cart-Token` em tudo.
- **Conteúdo:** tabela de itens (imagem, nome, cor/tamanho escolhidos, preço, `QuantityStepper`, total, remover), resumo (subtotal e total) e "Proceed to Checkout".
- **Regras:** quantidade 1..estoque (erro do back volta como mensagem inline); adicionar a mesma combinação soma; o subtotal vem do servidor; **sem frete e sem campo de cupom** (cupom vai para o pedido); botão para esvaziar.
- **Contador do header:** deriva de `['cart']`.
- **Estados:** vazio (`EmptyState` com link para o shop), loading, erro; token novo gera carrinho vazio sob demanda.
- **Riscos:** o carrinho pode expirar no back; tratar como vazio. O token é a única credencial.

## Entrega 4 — Checkout (`/checkout`)

- **Dados:** carrinho (`['cart']`); opcionalmente `POST /api/checkout/v1/validate` (se existir).
- **Conteúdo:** formulário de cobrança (nome, sobrenome, e-mail, celular, endereço linha 1 e 2, país, cidade, estado, CEP), "ship to different address" com o mesmo formulário, resumo do pedido. O checkbox "Create an account" do template sai (sem login). A escolha do método de pagamento vai para a tela do pedido (entrega 7).
- **Regras:** cobrança obrigatória; entrega opcional; e-mail e celular válidos; carrinho não vazio; campos **controlados**, com `name` e mensagens por campo (`ApiError.fields`).
- **Nesta entrega** "Place Order" ainda não cria pedido; ele passa a criar na entrega 5.
- **Estados:** carrinho vazio redireciona ao shop; erro de validação por campo.

## Entrega 5 — Pedido (`/orders/[number]`)

- **Criação:** "Place Order" chama `POST /api/order/v1` com `X-Cart-Token` e `{ billingAddress, shippingAddress? }`. Sucesso: guarda `number` no store (persistido), invalida `['cart']` e navega para `/orders/[number]`.
- **Dados:** `GET /api/order/v1/{orderNumber}`.
- **Conteúdo:** número, status (`CREATED`/`PAID`), itens (snapshot de nome, preço, cor, tamanho), endereços, subtotal, desconto, total.
- **Erros previstos:** estoque insuficiente (409 proposto, ou 400): mensagem e volta ao carrinho; carrinho vazio/expirado.
- **Regras:** quem tem o número vê o pedido; o app lembra o último número, sem lista de pedidos.
- **Estados:** loading, 404, erro.

## Entrega 6 — Cupom (na tela do pedido)

- **Dados:** `POST` e `DELETE /api/order/v1/{orderNumber}/coupon`.
- **Conteúdo:** campo de cupom e botão "Apply Coupon" com o pedido `CREATED`; ao aplicar, mostra o código, o desconto e o novo total, com opção de remover.
- **Regras:** só com pedido `CREATED`; cupom inválido (inativo, vencido, esgotado, abaixo do mínimo) volta como mensagem inline (400); inexistente (404); pedido não `CREATED` (409). Um cupom por pedido.
- **Estados:** campo desabilitado depois do pagamento.

## Entrega 7 — Pagamento simulado (na tela do pedido)

- **Dados:** `POST /api/order/v1/{orderNumber}/payment` com `{ method }`.
- **Conteúdo:** `RadioGroup` com `PAYPAL`, `DIRECT_CHECK`, `BANK_TRANSFER` (rótulos do template: PayPal, Direct Check, Bank Transfer) e botão "Pay".
- **Regras:** só com pedido `CREATED`; o valor cobrado é o `total` do servidor (o front não envia valor); aprovação automática; depois do sucesso o pedido vira `PAID` (mostra o pagamento e some o formulário e o cupom). Pedido já pago (409) recarrega o pedido. Cupom que deixou de valer no pagamento: mensagem e reaplicar.
- **Aviso:** pagamento é **simulado**; a tela não pede dados de cartão.

## Contato (`/contact`) e newsletter

Continuam como demos (confirmação local, nada enviado). Fora do escopo desta fase.

## Dependências entre telas

Home/Shop/Detalhe → Carrinho → Checkout → Pedido → (Cupom, Pagamento). O token do carrinho nasce na primeira escrita; o `orderNumber` nasce no "Place Order".
