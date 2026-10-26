# GeekShopping — Macroplano (10 km)

## Contexto

O workspace tem uma API Spring Boot (`geek-shopping-api`) e um front Next.js (`geek-shopping-app`). Hoje os dois estão desacoplados:

- **API:** só existe `Product` (CRUD paginado em `/api/product/v1`, 10 itens de seed). Não há categorias, carrinho, pedidos, validação nem testes reais. Todos os endpoints, inclusive os de escrita, são públicos.
- **App:** o visual é um port literal do MultiShop. Funciona de verdade só no cliente (carrinho, wishlist, busca, filtros e ordenação), lendo um mock de 9 itens (`USE_MOCK_PRODUCT_DATA = true`). Checkout, cupom e contato são demos sem backend. Carrinho e wishlist se perdem ao recarregar.
- **MultiShop** tem 5 páginas (home, shop, cart, checkout, contact). Não existe página de detalhe. As features vêm daí: categorias hierárquicas, filtros por preço/cor/tamanho com contagem, ordenação (latest/popularity/best rating), preço antigo, rating, cupom, endereço de cobrança/entrega, 3 métodos de pagamento.

Objetivo: transformar o par API+App em um e-commerce coerente, com o front deixando o mock e consumindo a API real, entregue na ordem da seção "Ordem de entrega".

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Login | **Sem login por ora.** Compra como convidado. Carrinho identificado por token guardado no navegador. A decisão pode ser reaberta (veja "Pontos em aberto"). |
| Dono de carrinho e pedido | `Cart` e `Order` nascem com dono opcional (`customer_id` nulo), para que um login futuro não obrigue a refazer essas tabelas. |
| Variações | Atributos N:N simples (Product ↔ Color, Product ↔ Size), estoque único no produto. |
| Pagamento | Simulado, com enum de métodos (PayPal, Direct Check, Bank Transfer). Sem gateway. |
| Cupom | Aplicado sobre um **pedido existente**, não sobre o carrinho. |

## Ordem de entrega

| # | Entrega | Módulo | Escopo |
|---|---|---|---|
| 1 | Cadastro de produtos (back) | M1 (back) + parte de M0 | Ver M1 e M0. |
| 2 | Listagem de produtos na Home (front consumindo a API real) | M1 (front) + parte de M0 | Ver M1 e M0. |
| 3 | Carrinho de compras | M3 | Ver M3. |
| 4 | Checkout do carrinho | M5 (parte) | Formulário e revisão. |
| 5 | Pedido de compras | M5 (núcleo) | Persistência do pedido. |
| 6 | Cupom de desconto | M4 | Aplicado sobre o pedido. |
| 7 | Pagamento do pedido (simulado) | M5 (`Payment`) | Aprovação automática. |

Dentro de cada entrega: spec de back → implementação da API → spec de front → integração no app. Cada uma ganha spec de back, spec de front e plano micro antes de ser implementada.

## Módulos

### M0 — Fundação (só o que as entregas exigem)
- **Entra:** Bean Validation, tratamento de erros de validação, base de testes (unitários e de integração) e remoção do mock no front (flag do mock vira variável de ambiente, depois o branch do mock sai).
- **Fica fora, salvo necessidade de alguma entrega:** Docker/Compose, perfis dev/prod, CI, senha do banco fora do `application.yml`.

### M1 — Catálogo (entregas 1 e 2)
- **Entidades:** `Category` (hierárquica, com `parent`, imagem), `Color`, `Size`, `Product` (evolui: preço `BigDecimal`, preço antigo, destaque, data de criação, popularidade, categoria como relacionamento, imagens, `rating` e `reviewCount` agregados e somente leitura, nulos/0 até haver avaliações).
- **Regras:** preço > 0; preço antigo, se existir, > preço atual; produto sem estoque aparece mas não pode ser comprado; contagem de produtos por categoria derivada.
- **Capacidades da API:** busca textual; filtro por categoria, faixa de preço, cor e tamanho; ordenação (latest, popularity); paginação; facets com contagem; listas de destaque e recentes.
- **Front (entrega 2):** Home com categorias, destaque e recentes vindos da API. Banners e hero continuam estáticos.

### M3 — Carrinho (entrega 3)
- **Entidades:** `Cart` (identificado por token gerado no cliente), `CartItem` (produto, quantidade, cor e tamanho escolhidos).
- **Regras:** quantidade ≥ 1 e ≤ estoque; adicionar produto já existente soma quantidade; subtotal calculado no servidor; carrinho expira por inatividade.
- **Front:** `/cart` e contadores do header consomem a API; o token fica em localStorage. O carrinho não mostra desconto.

### M5 — Checkout, pedido e pagamento (entregas 4, 5 e 7)
- **Entidades:** `Order`, `OrderItem` (com snapshot de nome e preço), `Address` (cobrança e entrega, copiado para o pedido), `Payment` (método, status).
- **Entrega 4 (checkout):** formulário de cobrança com entrega diferente opcional, validação e resumo do carrinho. O botão "Place Order" só é ligado à API na entrega 5.
- **Entrega 5 (pedido):**
  - O pedido nasce de um carrinho e o fecha.
  - O estoque é revalidado e baixado na criação, dentro de uma transação.
  - Os preços do pedido congelam o valor da hora da compra.
  - Sem endereço de entrega, usa o de cobrança.
  - Status inicial: criado (aceita cupom e pagamento).
- **Entrega 7 (pagamento simulado):** o método vira um enum; o pagamento é aprovado automaticamente e o pedido passa a "pago". O valor cobrado é o total já com desconto.

### M4 — Cupom (entrega 6)
- **Entidade:** `Coupon` (código, tipo percentual/fixo, validade, uso máximo, valor mínimo).
- **Regras:** aplicado a um pedido existente em status "criado"; um cupom por pedido; só antes do pagamento; válido apenas dentro da validade, abaixo do limite de usos e acima do valor mínimo; desconto nunca deixa o total negativo; aplicar o cupom recalcula o total do pedido. O limite de uso é global (sem login não há limite por cliente).
- **Front:** campo de cupom na tela do pedido (não no carrinho).

## Dependências

```
M0 (parcial) → M1 (entregas 1 e 2) → M3 (3) → M5 checkout (4) → M5 pedido (5) → M4 cupom (6) → M5 pagamento (7)
```

## Fora desta ordem

- **M2 (avaliações):** módulo `Review` e relacionados no detalhe. A página enxuta `/products/[id]` (sem avaliações) **entra no front na entrega 2**, usando `GET /api/product/v1/{id}`.
- **M6:** banners gerenciáveis, newsletter e contato. Os banners da Home ficam estáticos; os formulários de newsletter e contato continuam demos.
- **Frete** (`ShippingRule`): sem ele, o total do pedido é subtotal menos desconto.
- **Ciclo do pedido além de "pago":** enviado, entregue e cancelamento com devolução de estoque.
- **Consulta pública de pedido** por número e e-mail.
- **Comparar produtos, multi-moeda e multi-idioma.**
- **Infra da M0** não exigida pelas entregas (Docker, perfis, CI).

## Pontos em aberto

1. **Login.** Fora do plano por ora. Se for decidido depois, afeta:
   - Entrega 1: os endpoints de escrita do catálogo passariam a ser só para admin; sem login, ficam abertos.
   - Entrega 3: o carrinho teria dono; seria preciso mesclar o carrinho anônimo ao do usuário no login.
   - Entrega 4: o checkbox "Create an account" do MultiShop passaria a fazer sentido, e os endereços poderiam vir de uma conta salva.
   - Entrega 5: o pedido teria dono e uma tela "meus pedidos"; sem login e sem consulta por número e e-mail, o convidado não consegue rever o pedido.
   - Entrega 6: o limite de uso do cupom poderia ser por cliente.
   - Entrega 7: só o dono (ou quem tem o token do pedido) poderia pagar.
   - Mitigação já adotada: dono opcional em `Cart` e `Order`. Decidir antes da entrega 3 evita retrabalho.
2. ~~**Listagem `/products` com sidebar de filtros**~~ — **resolvido:** entra na entrega 2, com filtros, `facets` e ordenação no servidor.
3. **Frete:** fora da ordem; confirmar se o total do pedido fica sem frete.
4. **Imagens reais do catálogo:** as URLs do seed são fictícias (`example.com`), e não há upload no escopo. É preciso decidir de onde vêm as imagens antes da entrega 2.

## Riscos

- **Endpoints de escrita abertos** (produto, categoria, cupom, pedido), enquanto não houver login ou proteção mínima (por exemplo, uma chave de admin). Registrar nas specs que isso é provisório.
- **Estoque único por produto:** o carrinho guarda cor e tamanho, mas o estoque não distingue variante. Migrar para variantes depois custa uma refatoração em M1, M3 e M5.
- **`Double` na entidade vs. `decimal(65,2)` no banco:** M1 troca para `BigDecimal` antes de qualquer cálculo monetário.
- **Ids do carrinho pré-semeado no app** (1, 6, 9) deixam de fazer sentido com a API real.
- **Convenções a respeitar** (CLAUDE.md e skills do plugin): sem Lombok, flat-by-layer em `br.com.erudio`, `*ControllerDocs`, DTOs com Dozer, HATEOAS no service, migrations `V{N}__*.sql`, front fiel ao MultiShop e à skill de identidade visual.
