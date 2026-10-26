# 05 — Módulos

Visão em alto nível, na ordem de entrega. Entidades em [03](03-modelo-de-dados-e-migracoes.md), rotas em [04](04-contrato-da-api.md). O detalhe fino fica para o plano micro de cada módulo.

## Dependências

```
Catálogo → Carrinho → Checkout → Pedido → Cupom → Pagamento
```

## 1. Catálogo (entregas 1 e 2)

- **Entidades:** `Category`, `Color`, `Size`, `Product`.
- **Endpoints:** CRUD de produto e categoria; `GET` e `POST` de cor e tamanho; listagem filtrada e paginada; `facets`, `featured`, `recent`.
- **Regras:**
  - `price > 0`; `old_price`, se informado, `> price`.
  - `quantity ≥ 0`. Produto sem estoque aparece na listagem, mas não pode ser adicionado ao carrinho.
  - Categoria não pode ser pai de si mesma nem formar ciclo.
  - Excluir categoria com produtos ou subcategorias é bloqueado.
  - A contagem de produtos por categoria é derivada, nunca persistida.
- `rating` e `reviewCount` são somente leitura e ficam nulo/0 até existir um módulo de avaliações; o catálogo expõe os dois para o card do shop e aceita `sortBy=rating`.
- **Notas:** o `ProductRepository.getById` customizado é decisão do plano micro (ponto em aberto). O front da Home depende de `featured`, `recent` e da lista de categorias.
- **Riscos:** imagens fictícias no seed; escrita aberta.

## 2. Carrinho (entrega 3)

- **Entidades:** `Cart`, `CartItem`.
- **Endpoints:** ler carrinho, adicionar/alterar/remover item, esvaziar. Sempre com `X-Cart-Token`.
- **Regras:**
  - O carrinho é criado sob demanda na primeira escrita para o token.
  - Quantidade `≥ 1` e `≤` estoque do produto. Estoque é **verificado, não reservado**.
  - Adicionar uma combinação já existente (`produto + cor + tamanho`) soma a quantidade.
  - Cor e tamanho informados devem pertencer ao produto.
  - O subtotal é calculado no servidor a partir do preço atual do produto.
  - Carrinho `CONVERTED` não aceita novos itens. Expiração por inatividade fica para o plano micro (tarefa agendada ou limpeza na leitura).
- **Riscos:** o token é a única credencial; quem o tem controla o carrinho.

## 3. Checkout (entrega 4)

- **Sem entidade própria.** É a etapa de formulário e revisão do front.
- **Proposta de back:** `POST /api/checkout/v1/validate` valida endereço(s) e revalida estoque e totais do carrinho, **sem persistir nada**. Devolve o resumo ou os erros por campo. Pode ser dispensado se o front validar localmente; decidir no plano micro.
- **Regras:** endereço de cobrança obrigatório; endereço de entrega opcional; e-mail e celular válidos; carrinho não vazio.

## 4. Pedido (entrega 5)

- **Entidades:** `Order`, `OrderItem`, `Address`.
- **Endpoints:** criar pedido a partir do carrinho (`X-Cart-Token` + endereços no corpo); consultar por número.
- **Regras:**
  - Criar o pedido é uma transação única: revalida carrinho e estoque, baixa o estoque (update condicional), cria `Order`, `OrderItem` e `Address`, congela nome/preço/cor/tamanho, incrementa `popularity` e marca o carrinho `CONVERTED`.
  - Estoque insuficiente aborta tudo → `409`.
  - Status inicial `CREATED`. `total = subtotal − discount` (sem cupom, `discount = 0`).
  - O número do pedido é gerado no servidor.
- **Estados:** `CREATED → PAID`. Não há cancelamento nesta fase; estoque baixado não retorna.
- **Riscos:** pedido acessível por quem tem o número (sem login); duas compras simultâneas do último item (coberto pelo update condicional).

## 5. Cupom (entrega 6)

- **Entidade:** `Coupon`.
- **Endpoints:** aplicar e remover cupom de um pedido; CRUD administrativo de cupons.
- **Regras:**
  - Só em pedido `CREATED`.
  - Um cupom por pedido (aplicar outro substitui, ou erro; decidir no plano micro).
  - Válido apenas se `active`, dentro de `valid_from`/`valid_until`, com `used_count < max_uses` e `subtotal ≥ min_order_value`.
  - `PERCENTAGE`: `value` em %, `0 < value ≤ 100`. `FIXED`: valor absoluto. O desconto nunca passa do subtotal.
  - Aplicar e remover recalculam `discount` e `total` do pedido.
  - A validade é **revalidada no pagamento**. O `used_count` é incrementado só quando o pagamento é aprovado (update condicional), não ao aplicar.
- **Riscos:** cupom válido ao aplicar pode deixar de ser até o pagamento; nesse caso o pagamento falha com 400/409 e o cliente reaplica.

## 6. Pagamento simulado (entrega 7)

- **Entidade:** `Payment`.
- **Endpoint:** `POST /api/order/v1/{orderNumber}/payment` com o método (`PAYPAL`, `DIRECT_CHECK`, `BANK_TRANSFER`).
- **Regras:**
  - Só pedido `CREATED`; pedido já pago → `409`.
  - Sem gateway: o pagamento é **aprovado automaticamente**, grava `Payment` (`APPROVED`, valor = `total` do pedido) e muda o pedido para `PAID`, na mesma transação.
  - Revalida o cupom e incrementa seu uso (ver Cupom).
  - O valor cobrado é sempre o `total` do pedido no servidor, nunca vindo do cliente.
- **Riscos:** nenhuma integração real; o contrato deve permitir trocar a aprovação automática por um gateway sem mudar as rotas.
