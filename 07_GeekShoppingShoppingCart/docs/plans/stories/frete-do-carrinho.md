# Frete do carrinho

> Slug: `frete-do-carrinho` · Criada em: 26/10/2026 23:02 (esqueleto) · Planejada em: 31/10/2026 09:39 · Origem: pedido do usuário durante o planejamento de `carrinho-de-compras-com-token-de-convidado` e retomada em 31/10/2026

✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica

| Estado | Etapa | Skill | Data |
|---|---|---|---|
| ✅ | Planejamento | /erudio:implement-story | 31/10/2026 09:39 |
| ✅ | Plano aprovado | /erudio:implement-story | 31/10/2026 09:40 |
| ✅ | Implementação do Backend | /erudio:dev-backend | 31/10/2026 09:43 |
| ✅ | Implementação do Frontend | /erudio:dev-frontend | 31/10/2026 09:47 |
| ✅ | Implementação dos testes de Backend | /erudio:dev-unit-tests | 31/10/2026 09:52 |
| ✅ | Implementação dos testes de Frontend | /erudio:dev-ui-tests | 31/10/2026 09:55 |
| ✅ | Implementação dos testes de Integração | /erudio:dev-integration-tests | 31/10/2026 10:01 |
| ✅ | Agente de Code Review | /erudio:agent-code-review | 31/10/2026 10:06 |
| ✅ | Agente de Review de Performance | /erudio:agent-perf-review | 31/10/2026 10:08 |
| ✅ | Agente de Review de Segurança | /erudio:agent-security-review | 31/10/2026 10:12 |
| ✅ | Plano Implementado | /erudio:complete-story | 31/10/2026 10:17 |

## Contexto

O carrinho (história `carrinho-de-compras-com-token-de-convidado`, fechada em 27/10/2026) saiu sem frete: a API devolve `total = subtotal` e o front perdeu o frete fixo de 10 que existia no carrinho local. Na época o usuário pediu que o frete virasse uma história própria; esta é ela.

O frete passa a ser **calculado no servidor** e devolvido junto com o carrinho (`shipping`), com `total = subtotal + shipping`. O cálculo é um **valor fixo configurável**, por carrinho não vazio, definido no `application.yml` (mesma ideia do prazo de limpeza dos carrinhos abandonados: parametrizado, nunca uma constante no código). O front mostra a linha **Shipping** de volta no resumo do carrinho (`/cart`) e no resumo do checkout (`/checkout`), como no `MultiShop`, e exibe os valores que o servidor devolve, sem calcular nada.

Esta história **substitui** a decisão RN-8 do carrinho ("sem frete e sem desconto: `total = subtotal`") e as saídas deliberadas do guardrail visual ("sem linha Shipping" no carrinho e no checkout). Depende do carrinho; não depende do checkout (entrega 4), que só reaproveita o valor. O pedido (entrega 5) é quem vai congelar o frete na hora da compra.

Aproveita o que já existe: `CartService`, `CartDTO`, `CartControllerDocs`, os `application.yml`, `cart.ts` (modelo e serviço), `useCart`, `Cart.tsx`, `Checkout.tsx`, o MSW de teste (`serveCart`, `fixtures`) e o spec `e2e/cart.spec.ts`.

### Decisões tomadas

| # | Decisão | Origem |
|---|---|---|
| D-1 | O frete é um valor fixo configurável (padrão R$ 10,00), igual para qualquer carrinho com itens | usuário, 31/10/2026 |
| D-2 | A história cobre back e front: o carrinho devolve `shipping` e `total`; `/cart` e o resumo do `/checkout` mostram a linha Shipping | usuário, 31/10/2026 |
| D-3 | Regras propostas confirmadas: cálculo só no servidor, carrinho vazio paga 0, `total = subtotal + shipping`, o cupom não altera o frete, o pedido congelará o valor | usuário, 31/10/2026 |
| D-4 | Fora do escopo: frete por CEP, região, peso ou transportadora, e cupom de frete grátis | usuário, 31/10/2026 |
| D-5 | O frete não é persistido no carrinho (o carrinho nunca guarda valores calculados); não há migration | `backend/03` (carrinho não armazena preço); decisão derivada |

## Escopo

### Inclui

- Back: propriedade de configuração do valor fixo do frete (principal e de teste), serviço que calcula o frete, campo `shipping` no `CartDTO` e `total = subtotal + shipping` na resposta de todas as operações que devolvem o carrinho (`GET`, `POST /items`, `PUT /items/{itemId}`), documentação do Swagger atualizada.
- Front: `shipping` no modelo e no serviço do carrinho, exposto por `useCart`; linha Shipping no resumo de `/cart` e de `/checkout`; totais vindos do servidor.
- Atualizar os testes que afirmam `total = subtotal` (back, front e E2E) e o guardrail visual.

### Fora do escopo

Frete por CEP, região, peso, valor do produto ou transportadora; cupom de frete grátis e qualquer desconto (cupom é a entrega 6); persistir ou congelar o frete no pedido (entrega 5); frete grátis acima de um valor e tabela de faixas (podem virar outra história); prazo de entrega; mudança no contrato de entrada (`POST`/`PUT` não recebem frete); checkout, pedido e pagamento; as pendências das revisões do carrinho (CR-1, CR-7, SEC-1, SEC-2, TD-2 a TD-4) continuam como estão.

## Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RN-1 | O frete é calculado no servidor; o cliente nunca envia frete nem total, e um `shipping` ou `total` no corpo de `POST`/`PUT` é ignorado | decisão do usuário em 31/10/2026 (D-3); `backend/04` (valores do servidor) |
| RN-2 | O frete é um valor fixo configurável (`shipping.flat-rate`, padrão 10,00), o mesmo para qualquer carrinho com pelo menos um item, qualquer que seja a quantidade, o produto, a cor ou o tamanho | decisão do usuário em 31/10/2026 (D-1) |
| RN-3 | Um carrinho vazio, ou um token sem carrinho, tem frete 0,00 | decisão do usuário em 31/10/2026 (D-3) |
| RN-4 | O valor do frete é lido da configuração (`application.yml`), nunca de uma constante no código, e é tratado como `BigDecimal` com 2 casas e arredondamento `HALF_UP` | decisão do usuário em 31/10/2026; `backend/02` (dinheiro) |
| RN-5 | A resposta do carrinho traz `subtotal` (soma das linhas), `shipping` e `total = subtotal + shipping`; `itemCount` e os campos dos itens não mudam | `carrinho` RN-12 ampliada; D-3 |
| RN-6 | O frete não é persistido: o carrinho continua sem guardar valores calculados e o frete é recalculado a cada leitura | `backend/03` (carrinho não armazena preço); D-5 |
| RN-7 | O cupom e o desconto não alteram o frete (o cupom é aplicado ao pedido, entrega 6) | decisão do usuário em 31/10/2026 (D-3, D-4); `macroplano` M4 |
| RN-8 | O pedido (entrega 5) deve congelar o frete da hora da compra, como congela nome e preço dos itens; nesta história isso só fica registrado | decisão do usuário em 31/10/2026 (D-3); `macroplano` M5 |
| RN-9 | `/cart` e o resumo de `/checkout` mostram a linha Shipping entre Subtotal e Total, com o valor do servidor formatado em BRL, e o total exibido é o do servidor (o front não soma nada) | decisão do usuário em 31/10/2026 (D-2); `frontend/04` (dado do servidor no Query) |
| RN-10 | O frete aparece nos estados que já existem (carregando, vazio, erro); o carrinho vazio continua mostrando o estado vazio, sem resumo | `frontend/05` (Entrega 3); `carrinho` RN-17 |
| RN-11 | A API continua sem endpoint de frete: o valor viaja no carrinho, sem nova rota | decisão derivada (D-2, D-5) |

## Backend

Ordem de implementação, em `geek-shopping-api`, sem código:

1. **Configuração.** Chave `shipping.flat-rate` (valor 10.00) no `application.yml` principal e no de teste (cópia completa, como já é a regra); lida por `@Value` no serviço, com o mesmo padrão do prazo de limpeza.
2. **`ShippingService`** (`services/`): calcula o frete de um carrinho a partir da quantidade de itens: sem itens devolve 0,00; com itens devolve o valor configurado com escala 2 e `RoundingMode.HALF_UP`. É a única classe que conhece a regra, para a entrega 5 reutilizar o mesmo cálculo.
3. **`CartDTO`:** novo campo `shipping` (`BigDecimal`), com `equals`/`hashCode` ajustados e o schema do Swagger documentado.
4. **`CartService`:** `toDto` passa a chamar o `ShippingService` e a montar `total = subtotal + shipping`; o carrinho vazio (token sem carrinho) devolve `shipping` e `total` 0,00 e continua sem gravar nada; `subtotal` continua sendo só a soma das linhas.
5. **`CartControllerDocs`:** as descrições de `GET`, `POST /items` e `PUT /items/{itemId}` dizem que o `total` inclui o frete. Sem novo endpoint, sem migration, sem mudança nos corpos de entrada.

Alinhamentos de `backend/07-alinhamento-do-codigo-atual.md` tocados: `BigDecimal` com `HALF_UP` no código novo (o `setScale` sem arredondamento do carrinho, CR-6, não é alterado aqui).

## Frontend

Em `geek-shopping-app`:

1. **Modelo e serviço.** `app/core/models/cart.ts` ganha `shipping`; `app/core/api/cart.ts` mapeia o campo (resposta sem `shipping` vira 0 para não quebrar).
2. **Hook.** `useCart` passa a expor `shipping` (padrão 0 enquanto carrega), ao lado de `subtotal` e `total`; nenhum cálculo no cliente.
3. **`/cart`.** O resumo volta a ter a linha Shipping entre Subtotal e Total, como em `cart.html` do `MultiShop` (reler o arquivo antes de alterar); sem mudança nos estados carregando, vazio e erro.
4. **`/checkout`.** O resumo do pedido volta a mostrar a linha Shipping e o total do servidor.
5. **Guardrail visual.** Atualizar `.claude/skills/geek-shopping-app-visual-identity/SKILL.md`: sai a saída deliberada "sem linha Shipping" do carrinho e do checkout.
6. **Testes de apoio.** `test/fixtures.ts` (`buildCartResponse` passa a incluir `shipping` e `total = subtotal + shipping`) e `test/msw/serveCart.ts`, para os testes de front não divergirem do contrato.

Respeitar a direção de dependência `page` → `feature` → `ui` / `hooks` → `core` / `store`, sem comentários e sem nova biblioteca de ícones.

## Testes

- **Unitários (back):** `ShippingServiceTest` (RN-2 a RN-4: sem itens 0,00, com itens o valor configurado, escala e arredondamento, outro valor de configuração); `CartServiceTest` ajustado (RN-5: `total = subtotal + shipping`, carrinho vazio com frete 0,00, frete igual com 1 ou muitos itens).
- **Integração (back):** `CartControllerJsonTest` e `CartLifecycleJsonTest` ajustados (a asserção `total = subtotal` passa a `total = subtotal + shipping`); novos casos: `shipping` presente em `GET`, `POST` e `PUT`, constante com uma ou várias unidades e produtos, 0,00 com carrinho vazio e depois de esvaziar, `shipping`/`total` no corpo do `POST` ignorados; `SwaggerIntegrationTest` com o campo `shipping` no schema.
- **UI (front):** `cart.test.ts` (mapeamento de `shipping`, resposta sem o campo), `useCart.test.tsx`, `Cart.test.tsx` (linha Shipping com o valor do servidor, total do servidor mesmo quando difere da soma local, estados carregando/vazio/erro) e `Checkout.test.tsx` (linha Shipping e total do servidor).
- **E2E (Playwright, executado pelo usuário):** `e2e/cart.spec.ts` ajustado: o resumo do carrinho e o do checkout mostram Shipping e o total inclui o frete (hoje os testes afirmam que não há Shipping).

Mapeamento `RN` → camada: RN-1 a RN-8 e RN-11 (back: unitário e integração); RN-9 e RN-10 (front: UI; E2E para o fluxo).

## Riscos

- Muda o contrato do carrinho já entregue (campo novo e `total` diferente): testes, E2E e o guardrail que afirmam "sem frete" precisam ser atualizados juntos, senão ficam vermelhos.
- Valor fixo não reflete custo real de envio: é uma simplificação consciente até existir a história de frete por região ou faixa.
- O total deixa de bater com `subtotal`; qualquer cliente que some as linhas por conta própria passa a divergir do servidor (o front não faz isso).
- Configuração inválida (valor negativo ou não numérico) pode subir a aplicação com frete errado; ver pontos em aberto.
- Sem frete congelado no pedido, uma mudança de configuração entre o carrinho e o pedido mudaria o total; por isso o pedido (entrega 5) deve guardar o valor (RN-8).

## Pontos em aberto

1. **Nome e padrão da propriedade.** Sugestão: `shipping.flat-rate` com padrão 10.00 (valor do front antigo); confirmar.
2. **Validação da configuração.** Sugestão: aceitar valor maior ou igual a zero e falhar na subida se for negativo ou inválido; hoje o projeto não valida propriedades.
3. **Rótulo com frete 0.** Se a configuração for 0, sugestão: mostrar R$ 0,00 como qualquer valor, sem texto "Free".
4. **Pedido e frete congelado (entrega 5).** Registrar na história do pedido que `Order.total = subtotal + shipping − discount` e que o frete é gravado no pedido.
5. **Specs e macroplano a atualizar** (hoje dizem "sem frete"): `backend/03` (`Order.total`), `backend/04`, `backend/05` (carrinho e pedido), `frontend/05` (Entrega 3), `frontend/07` (B8), macroplano (Pontos em aberto 3 e M3/M5).
6. **Pendências das revisões do carrinho.** CR-1, CR-7, SEC-1, SEC-2 e TD-2 a TD-4 não foram marcados como fora do escopo pelo usuário; sugestão: ficam fora e viram uma história própria, salvo decisão em contrário.
7. **Frete grátis acima de um valor e faixas de subtotal.** Foram ofertados e não escolhidos; ficam registrados como possível evolução.

## Critérios de aceite

| ID | Critério | Verifica |
|---|---|---|
| AC-1 | `GET /api/cart/v1` de um carrinho com itens devolve `shipping` igual ao valor configurado (10,00 por padrão) e `total = subtotal + shipping` | RN-2, RN-5 |
| AC-2 | Um token sem carrinho, ou um carrinho esvaziado, devolve `shipping` 0,00 e `total` 0,00, e nada é gravado | RN-3, RN-6 |
| AC-3 | O frete é o mesmo com uma unidade, várias unidades ou vários produtos | RN-2 |
| AC-4 | `POST /items` e `PUT /items/{itemId}` devolvem o carrinho com `shipping` e `total` atualizados | RN-5 |
| AC-5 | Um `shipping` ou `total` enviado no corpo do `POST` ou do `PUT` é ignorado | RN-1 |
| AC-6 | O valor do frete vem da configuração: com outro valor, o serviço devolve o outro valor sem mudar código, com 2 casas e `HALF_UP` | RN-4 |
| AC-7 | O schema do Swagger de `CartDTO` documenta `shipping` e as descrições dizem que o `total` inclui o frete | RN-5 |
| AC-8 | `/cart` mostra a linha Shipping entre Subtotal e Total com o valor do servidor, e o Total exibido é o do servidor mesmo quando difere da soma local | RN-9 |
| AC-9 | O resumo de `/checkout` mostra a linha Shipping e o total do servidor | RN-9 |
| AC-10 | Carregando, vazio e erro continuam como antes; o carrinho vazio não mostra resumo | RN-10 |
| AC-11 | Os testes e o guardrail que afirmavam "sem frete" foram atualizados e a suíte do back e do front passa | RN-5, RN-9 |

## Implementado

### Backend

Concluído em 31/10/2026 09:43. Pasta `geek-shopping-api`.

**Migrations:** nenhuma (D-5: o carrinho não persiste valores calculados).

**Arquivos novos** (`src/main/java/br/com/erudio`):
- `services/ShippingService`: `calculate(int itemCount)` devolve 0,00 sem itens e, com itens, o valor fixo configurado com escala 2 e `RoundingMode.HALF_UP`. É a única classe que conhece a regra (o pedido da entrega 5 pode reaproveitá-la). A propriedade é lida por `@Value("${shipping.flat-rate}")` **sem valor padrão no código**, para não repetir o problema de defaults duplicados do TD-7: a chave tem de existir no `application.yml`, senão a aplicação não sobe.

**Arquivos alterados:**
- `data/dto/CartDTO`: novo campo `shipping` (`BigDecimal`), com getter, setter, `equals` e `hashCode`.
- `services/CartService`: injeta o `ShippingService`; `toDto` monta `shipping = shippingService.calculate(itemCount)` e `total = subtotal + shipping`; `subtotal` continua sendo só a soma das linhas; o token sem carrinho devolve `shipping` e `total` 0,00 e continua sem gravar nada.
- `controllers/docs/CartControllerDocs`: as descrições de `GET`, `POST /items` e `PUT /items/{itemId}` dizem que a resposta traz o frete e o total.
- `src/main/resources/application.yml` e `src/test/resources/application.yml`: chave `shipping.flat-rate: 10.00` (cópia completa nos dois).

**Endpoints** (sem rota nova; só o corpo de resposta do carrinho ganha `shipping`): `GET /api/cart/v1` 200; `POST /api/cart/v1/items` 200; `PUT /api/cart/v1/items/{itemId}` 200. `DELETE /api/cart/v1` e `DELETE /api/cart/v1/items/{itemId}` continuam 204, sem corpo.

**Build:** `./mvnw -q clean package -DskipTests` em `geek-shopping-api`: sucesso (jar gerado). Nenhum teste foi escrito nem executado nesta etapa; a aplicação não foi iniciada. Busca por `lombok` e comentários no arquivo novo: sem ocorrências.

**RN cobertas:** RN-1 (o frete só existe no servidor; os DTOs de entrada não têm o campo), RN-2 a RN-6, RN-8 (apenas registrada) e RN-11. **AC com código pronto:** AC-1 a AC-7 (a verificação fica para os testes).

**Alinhamento (`backend/07`):** o código novo usa `BigDecimal` com `HALF_UP`; o `setScale` sem arredondamento do carrinho (CR-6) não foi alterado aqui.

**Observações para as próximas etapas:**
- Os testes do carrinho feitos na história anterior precisam ser atualizados em `/erudio:dev-unit-tests` e `/erudio:dev-integration-tests`: `CartServiceTest` usa `@InjectMocks` sem um mock de `ShippingService`, então o `toDto` vai falhar com `NullPointerException` até o mock ser declarado; `CartControllerJsonTest`, `CartLifecycleJsonTest` e outros afirmam `total = subtotal`, que agora é `subtotal + shipping`.
- O valor de `shipping.flat-rate` não é validado (aceita valor negativo); é o ponto em aberto 2 do plano, mantido com a sugestão de validar depois.
- A propriedade sem padrão no código é uma decisão desta etapa: o plano pedia "mesmo padrão do prazo de limpeza", mas esse padrão duplicado é o TD-7; o valor 10,00 vive só no yml.

### Frontend

Concluído em 31/10/2026 09:47. Pasta `geek-shopping-app`. O pré-requisito "Implementação do Backend" estava ✅ (09:43), e o contrato foi confirmado lendo o código do backend: `CartDTO` devolve `shipping` e `total = subtotal + shipping` em `GET`, `POST /items` e `PUT /items/{itemId}`.

**Arquivos alterados:**
- `app/core/models/cart.ts`: `Cart.shipping`.
- `app/core/api/cart.ts`: mapeia `shipping` da resposta; uma resposta sem o campo vira 0.
- `hooks/useCart/useCart.ts`: expõe `shipping` (0 enquanto carrega), ao lado de `subtotal` e `total`; nenhum cálculo no cliente.
- `components/feature/Cart/Cart.tsx`: o resumo de `/cart` volta a ter a linha **Shipping** entre Subtotal e Total, como em `MultiShop/cart.html` (releído: Subtotal, Shipping, depois Total); o Total exibido é o do servidor.
- `components/feature/Checkout/Checkout.tsx`: o resumo do pedido volta a mostrar a linha Shipping com o valor do servidor.
- `.claude/skills/geek-shopping-app-visual-identity/SKILL.md`: sai a saída deliberada "sem linha Shipping"; o carrinho e o checkout seguem o `cart.html` literal nessa linha.
- `CLAUDE.md` do app: os totais (subtotal, frete e total) vêm da API.

**Rotas e telas:** `/cart` e `/checkout` (nenhuma rota nova). Os três estados (carregando, vazio, erro) não mudaram.

**Endpoints consumidos:** `GET /api/cart/v1`, `POST /api/cart/v1/items`, `PUT /api/cart/v1/items/{itemId}` (campo `shipping` novo no corpo de resposta); `DELETE /api/cart/v1` e `DELETE /api/cart/v1/items/{itemId}` sem mudança.

**Comandos** (`geek-shopping-app`):
- `npx tsc --noEmit`: sem erros.
- `npm run lint`: 0 erros, 7 avisos `no-img-element` que já existiam.
- `npm run build`: sucesso.
- Conferência visual: **pendente** (o servidor de desenvolvimento não foi iniciado).

**Nota sobre os testes (não são desta etapa):** `npx vitest run` roda 442 testes, com 438 passando e 4 falhando por afirmarem "sem frete": `cart.test.ts` (`maps the cart of the API…` e `reads an empty cart`, que não esperam `shipping`), `Cart.test.tsx` (`has neither shipping nor coupon`) e `Checkout.test.tsx` (`summarizes the lines… and no shipping`). Eles e as fixtures `test/fixtures.ts` e `test/msw/serveCart.ts` (que ainda montam o carrinho com `total = subtotal`) são atualizados em `/erudio:dev-ui-tests`.

**RN cobertas:** RN-9 e RN-10. **AC com código pronto:** AC-8, AC-9, AC-10 (a verificação fica para os testes).

**Alinhamento (`frontend/07`):** B8 (frete) volta a ser atendido do lado certo: o valor vem do servidor, sem constante no front. Nada deferido.

**Diferenças entre spec e código do backend:** `frontend/05` (Entrega 3) e `backend/03`, `04`, `05` ainda dizem "sem frete"; o código entregue calcula o frete. Já está no ponto em aberto 5 da história.

**Observação:** o front mostra `R$ 0,00` quando o frete é 0 (ponto em aberto 3 do plano, mantido com a sugestão).

### Testes de Backend

Concluído em 31/10/2026 09:52. Pasta `geek-shopping-api`, `src/test/java/br/com/erudio`. Docker ativo (confirmado com `docker info`), então a suíte completa rodou, inclusive os testes de repositório e de integração.

**Classes criadas:**
- `unittests/services/ShippingServiceTest` (20 testes, JUnit 6 + Mockito, sem Spring): o valor configurado entra por `ReflectionTestUtils`, sem `@SpringBootTest`.

**Classes alteradas:**
- `unittests/services/CartServiceTest` (46 para 54 testes): passou a declarar `@Mock ShippingService` com um *stub* leniente de `calculate`, atualizou duas asserções ao novo contrato (o carrinho vazio agora também afirma `shipping` 0,00; o teste de totais passou de `total = subtotal` para `total = subtotal + shipping`, com o `@DisplayName` ajustado) e ganhou 8 testes do frete.

**Ajuste em testes de integração existentes (necessário para a suíte ficar verde):** `CartControllerJsonTest` (linhas 80, 116, 128 e 163) e `CartLifecycleJsonTest` (linha 83) afirmavam `total = subtotal`, regra substituída por esta história; os valores esperados passaram a somar os 10,00 do frete (60,00, 175,00, 60,00, 175,00 e 70,00). Nenhuma asserção foi afrouxada nem removida; os casos novos de integração (frete em `GET`/`POST`/`PUT`, constante com várias unidades, `shipping` ignorado no corpo, schema do Swagger) ficam para `/erudio:dev-integration-tests`.

**Mapeamento RN → teste:**
- RN-1: o campo `shipping` não existe nos DTOs de entrada; a prova por requisição fica na integração.
- RN-2: `ShippingServiceTest` (`itemsPayTheFlatRate`, `flatRateIgnoresTheQuantity` com 6 valores até `Integer.MAX_VALUE`, `zeroFlatRateIsFree`); `CartServiceTest` (`shippingIsCalculatedFromTheNumberOfUnits`).
- RN-3: `ShippingServiceTest` (`noItemsNoShipping`, `negativeItemCountNoShipping`); `CartServiceTest` (`emptyCartHasNoShipping`, `clearedCartHasNoShipping`, `findReturnsAnEmptyCartWithoutWriting`).
- RN-4: `ShippingServiceTest` (`alwaysTwoDecimalPlaces`, `roundsHalfUp` com 5 valores, `anotherConfiguredValue`).
- RN-5: `CartServiceTest` (`totalsAreComputedByTheServer`, `addItemAnswersWithShippingAndTotal`, `updateItemAnswersWithShippingAndTotal`, `subtotalDoesNotIncludeTheShipping`, `convertedCartKeepsItsShipping`).
- RN-6: `CartServiceTest` (`shippingIsRecalculatedOnEveryRead`, que também verifica que nada é gravado).
- RN-7, RN-8, RN-11: sem comportamento a testar nesta camada (cupom e pedido são outras entregas; não há rota nova).
- RN-9 e RN-10: front (`/erudio:dev-ui-tests`).

**AC verificados por unidade:** AC-1 e AC-2 (parte do service), AC-3 e AC-4 (no `CartService` e no `ShippingService`), AC-6. AC-5 e AC-7 ficam para a integração; AC-8 a AC-10 para o front; AC-11 é fechado quando as etapas de teste terminarem.

**Comando e resultado:** `./mvnw test` em `geek-shopping-api`: 423 testes, 0 falhas, 0 erros, 0 ignorados (BUILD SUCCESS). `ShippingServiceTest` e `CartServiceTest` rodaram também isolados, com `CartCleanupServiceTest`: 77 testes verdes.

**Não executado:** nada ficou de fora.

**Defeito de produção encontrado:** nenhum. Observação (`baixa`, tolerável, já no ponto em aberto 2 do plano): `ShippingService` aceita um `shipping.flat-rate` negativo; `ShippingServiceTest` não trava isso porque o comportamento ainda não foi decidido.

### Testes de Frontend

Concluído em 31/10/2026 09:55. Pasta `geek-shopping-app`. Nenhum código de produção foi alterado nesta etapa e nenhuma dependência foi adicionada (MSW e Testing Library já estavam instalados).

**Apoio de teste alterado:** `test/fixtures.ts`: `buildCartResponse(items, shipping?)` agora devolve `shipping` (10,00 quando há itens, 0 quando não há; a constante `FLAT_SHIPPING` fica na fixture) e `total = subtotal + shipping`; `test/msw/serveCart.ts` herda isso porque monta suas respostas com `buildCartResponse`.

**Testes alterados (6 que afirmavam "sem frete" ou o total antigo):**
- `app/core/api/__test__/cart.test.ts`: o mapeamento completo e o carrinho vazio passaram a esperar `shipping`.
- `hooks/__test__/useCart.test.tsx`: `exposes the items and the totals computed by the server` espera `shipping` 10 e `total` 100.
- `components/feature/Cart/__test__/Cart.test.tsx`: o resumo espera a linha Shipping e `total` 100,00; `has neither shipping nor coupon` virou `shows the shipping between the subtotal and the total and has no coupon` (a ordem Subtotal, Shipping, Total é conferida no DOM).
- `components/feature/Checkout/__test__/Checkout.test.tsx`: `summarizes the lines … and no shipping` virou `… with the shipping and the total of the server`.

**Testes novos (11):**
- `cart.test.ts`: mapeia `shipping` e `total` exatamente como o servidor envia; resposta sem `shipping` vira 0; `POST` e `PUT` trazem `shipping` e `total` do carrinho.
- `useCart.test.tsx`: frete 0 enquanto carrega e com carrinho vazio; expõe o `total` do servidor mesmo quando difere de `subtotal + shipping`; atualiza frete e total depois de mudar a quantidade de um item.
- `Cart.test.tsx`: frete e total do servidor mesmo quando diferem da soma local; frete 0,00 quando o servidor não cobra; novo frete e novo total depois de mudar a quantidade; sem resumo nem Shipping carregando, vazio e com erro.
- `Checkout.test.tsx`: frete e total do servidor mesmo quando diferem da soma local; sem linha Shipping com o carrinho vazio.

**Mapeamento RN → teste (front):**
- RN-9: `Cart.test.tsx` (linha Shipping entre Subtotal e Total, valor e total do servidor, frete 0,00, atualização após mudar a quantidade), `Checkout.test.tsx` (linha Shipping e total do servidor), `cart.test.ts`, `useCart.test.tsx` (nenhum cálculo no cliente: o total do servidor prevalece).
- RN-10: `Cart.test.tsx` (sem resumo em carregando, vazio e erro), `Checkout.test.tsx` (carregando e vazio).
- RN-1 a RN-8 e RN-11: back (`dev-unit-tests` e `dev-integration-tests`); no front, RN-1 também aparece como "o cliente não envia frete" (os corpos de `addItem` e `updateItem` em `cart.test.ts` só têm `productId`, `quantity`, `color` e `size`).

**AC cobertos no front:** AC-8, AC-9, AC-10. AC-1 a AC-7 são do back; AC-11 fecha quando a suíte inteira e as etapas de teste terminarem (a de integração e o ajuste do E2E ainda estão pendentes).

**Comandos e resultados** (`geek-shopping-app`):
- `npx vitest run`: 23 arquivos, 453 testes passando (eram 442).
- `npx tsc --noEmit`: sem erros.
- `npm run lint`: 0 erros, 7 avisos `no-img-element` que já existiam.

**Defeito de produção encontrado:** nenhum.

### Testes de Integração

Concluído em 31/10/2026 10:01. Imagem do MySQL do Testcontainers: `mysql:9.1.0` (fixa, com `mysql-default-conf`), iniciada uma vez por JVM pelo `AbstractIntegrationTest` existente. Docker confirmado com `docker info` antes de começar. Nenhum código de produção foi alterado.

**Classe criada:**
- `integrationtests/controllers/withjson/CartShippingJsonTest` (13 testes, cada um com token próprio e produtos criados pela API): o valor de teste é 10,00 e é lido de `shipping.flat-rate` do ambiente; token novo tem frete e total 0,00 e nada é gravado; adicionar cobra o frete configurado (2 casas) e soma ao total; o frete é o mesmo com qualquer quantidade e qualquer número de produtos (12 unidades, 2 produtos); `total = subtotal + shipping` em `POST`, `PUT`, `GET` e no segundo produto; atualizar a quantidade mantém o frete e recalcula o total; remover um item mantém o frete enquanto houver itens e zera com o último; esvaziar zera; `shipping` e `total` no corpo de `POST` e de `PUT` são ignorados; cada carrinho paga o seu; carrinho `CONVERTED` continua sendo lido com o frete; nenhuma coluna de frete ou total existe em `carts` nem em `cart_items`.

**Arquivos alterados:**
- `integrationtests/dto/CartDTO`: campo `shipping` (getter, setter, `equals`, `hashCode`).
- `integrationtests/swagger/SwaggerIntegrationTest` (11 para 13 testes): o schema `CartDTO` documenta `items`, `itemCount`, `subtotal`, `shipping` e `total` (`shipping` e `total` como `number`), e as descrições de `GET`, `POST /items` e `PUT /items/{itemId}` dizem que a resposta traz o frete e o total.
- `integrationtests/ApiIntegrationTest`: novo `@BeforeAll` que força o contexto da aplicação a subir antes dos `@BeforeAll` das subclasses. Corrige um defeito latente de testes anteriores: `CartControllerJsonTest` e `CartControllerErrorsJsonTest` criam produtos pela API em `@BeforeAll` estático e só passavam quando outra classe já tinha subido o contexto; agora cada classe roda sozinha (conferido com `CartShippingJsonTest` e `CartControllerErrorsJsonTest` isoladas).
- Os ajustes de `total` em `CartControllerJsonTest` e `CartLifecycleJsonTest` foram feitos na etapa de testes do backend.

**Spec E2E (Playwright), executado pelo usuário:** `geek-shopping-app/e2e/cart.spec.ts` agora tem 12 testes: o antigo "sem frete" virou "o resumo do carrinho mostra o frete e um total que o inclui" (lê Subtotal, Shipping e Total da tela e confere `total = subtotal + 10,00`); novos "o resumo do checkout mostra o mesmo frete e total" e "mudar a quantidade mantém o frete e move o total"; "um visitante novo vê o carrinho vazio e nenhum resumo" foi renomeado. **Não foi executado:** exige a API em `:8080`, o MySQL e o app em `:3000` no ar, e a execução é do usuário. Validado com `npx playwright test --list` (20 testes em 2 arquivos) e `npx tsc --noEmit`. **Pendência aceita pelo usuário em 31/10/2026:** fechar a etapa com o E2E ainda sem resultado (`npm run e2e`).

**Mapeamento RN/AC → teste:**
- RN-1 / AC-5: `CartShippingJsonTest` (`aShippingOrTotalSentInTheBodyOfAnAddIsIgnored`, `...OfAnUpdateIsIgnored`).
- RN-2 / AC-1 / AC-3: `CartShippingJsonTest` (`addingAnItemChargesTheConfiguredShipping...`, `theShippingIsTheSameForAnyQuantityAndAnyNumberOfProducts`).
- RN-3 / AC-2: `CartShippingJsonTest` (`aNewTokenHasNoShippingAndNothingIsStored`, `removingAnItemKeepsTheShipping...`, `clearingTheCartDropsTheShipping`).
- RN-4 / AC-6: `theTestConfigurationChargesTenByDefault` e a verificação de 2 casas; arredondamento e outro valor em `ShippingServiceTest` (unidade).
- RN-5 / AC-4: `theTotalIsAlwaysTheSubtotalPlusTheShippingOnEveryOperation`, `updatingTheQuantityKeepsTheShippingAndRecomputesTheTotal`.
- RN-6: `theShippingIsNotStoredInTheDatabase`, `aNewTokenHasNoShippingAndNothingIsStored`.
- RN-7 e RN-8: sem comportamento a testar nesta história (cupom e pedido são outras entregas).
- RN-11: nenhuma rota nova; coberto por `onlyTheVersionedApiPathsAreDocumented` (conjunto exato de rotas, inalterado).
- AC-7: `SwaggerIntegrationTest` (`theCartSchemaDocumentsTheSubtotalTheShippingAndTheTotal`, `theCartOperationsSayThatTheResponseCarriesTheShippingAndTheTotal`).
- RN-9 / RN-10 / AC-8 a AC-10: Vitest (etapa anterior) e `e2e/cart.spec.ts` (pendente de execução).
- AC-11: back verde (438), front verde (453), guardrail e testes que diziam "sem frete" atualizados.

**Comandos e resultados:** `./mvnw test` em `geek-shopping-api`: 438 testes, 0 falhas, 0 erros, 0 ignorados (BUILD SUCCESS), incluindo `StartupTests` e os testes de repositório; as classes novas rodaram também isoladas. No app: `npx vitest run` 453 passando (etapa anterior), `npx tsc --noEmit` sem erros e `npm run lint` com 0 erros (7 avisos antigos).

**Defeito de produção encontrado:** nenhum.

## Resultados dos reviews

### Code Review

Executado em 31/10/2026 10:06 pelo agente `erudio:code-reviewer` (somente leitura; nada foi compilado nem executado). Escopo: 4 arquivos de produção do backend, os 2 `application.yml`, 8 arquivos de teste do backend, 5 de produção do frontend, 6 de teste e apoio do frontend, o E2E, e dois documentos do app. Os achados da história anterior (CR-1 a CR-11, PF, SEC e TD-2 a TD-11) são `conhecido` e não foram repetidos; nenhum piorou. O CR-6 (`CartService.java:211`) e o CR-1 continuam como estavam; o TD-7 cresceu um pouco pela constante duplicada (CR-13).

**Escopo analisado:** a história `frete-do-carrinho` e, da anterior, só a lista de achados; backend: `ShippingService`, `CartService`, `CartDTO`, `CartControllerDocs`, os dois `application.yml`, `ShippingServiceTest`, `CartShippingJsonTest`, `ApiIntegrationTest` (inteiros) e o diff de `CartServiceTest`, `CartControllerJsonTest`, `CartLifecycleJsonTest`, `integrationtests/dto/CartDTO`, `SwaggerIntegrationTest`, mais vizinhos (`CartApi.assertMoney`, `AbstractIntegrationTest`, `CartCleanupService` e seu teste); frontend: `Cart.tsx` e `serveCart.ts` inteiros, o diff de `models/cart.ts`, `api/cart.ts`, `useCart.ts`, o resumo do `Checkout.tsx`, os CSS dos resumos, `CLAUDE.md`, o guardrail visual, `fixtures.ts`, os testes de cart, hook, Cart e Checkout e `e2e/cart.spec.ts`; referência visual `MultiShop/cart.html` (321-335) e `MultiShop/checkout.html` (324-338); specs e macroplano por busca de frete, subtotal e total.

**Aderência à história (RN/AC, fora do escopo):** checado, sem achados no código. Todas as RN e AC têm implementação (RN-1 a RN-6, RN-9 a RN-11, AC-1 a AC-11); RN-7 e RN-8 só ficam registradas, como a história manda; nada do "Fora do escopo" foi implementado. Só a documentação ficou para trás (CR-14).
**Camadas, nomes e estilo do backend:** CR-12 e CR-13. Também checado: `ShippingService` só tem a regra e `CartService.toDto` só compõe (`CartService.java:192-195`); `equals`/`hashCode` de `CartDTO` usam getters e incluem `shipping`; sem Lombok nem comentários; dinheiro em `BigDecimal` com `HALF_UP` no código novo.
**Migrations:** checado, sem achados (nenhuma migration nova nem alterada, como manda D-5).
**Contrato da API, erros e validação:** checado, sem achados. Nenhuma rota nova (RN-11); os corpos de entrada e os status não mudaram; as descrições de `GET`, `POST /items` e `PUT /items/{itemId}` (`CartControllerDocs.java:25, 54, 72`) dizem que a resposta traz o frete e o total; o schema `CartDTO` documenta `shipping` pela introspecção do springdoc.
**Arquitetura do frontend:** checado, sem achados. `shipping ?? 0` fica no adaptador; `useCart` expõe `shipping` com 0 enquanto carrega; `Cart.tsx` e `Checkout.tsx` mostram os valores do servidor sem somar nada; direção de dependência e os três estados preservados (`Cart.tsx:37-51`).
**Guardrails visuais do frontend:** checado, sem achados. A linha Shipping fica entre Subtotal e Total como em `cart.html:321-335` e `checkout.html:324-338`, reusa `summaryRow` (tokens) e tem a mesma marcação que existia antes da história do carrinho; o guardrail (`SKILL.md:150`) foi atualizado sem sobrar "no Shipping row"; a atribuição do MultiShop não foi tocada.
**Testes:** CR-15, CR-16 e CR-17. Os testes que o plano promete existem e não há nenhum desabilitado, pulado ou vazio; o `ReflectionTestUtils` com `"flatRate"` segue o padrão de `CartCleanupServiceTest` e não é achado.

#### CR-12 · `shipping.flat-rate` não é validado (negativo ou vazio)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:14-19`
- Evidência: `@Value("${shipping.flat-rate}") private BigDecimal flatRate;` e `return flatRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);` sem nenhuma checagem. Valor negativo faz o `total` ficar menor que o `subtotal` (com `-50.00` e subtotal `25.00`, o total sai `-25.00`). Chave presente mas vazia (`shipping.flat-rate:` ou variável de ambiente vazia): pelo editor padrão de números do Spring, que aceita vazio, o campo deve virar `null`, e o primeiro carrinho com itens dá `NullPointerException` (500) em vez de a aplicação falhar na subida (deduzido, não executado). A falta de padrão no `@Value` só protege contra a chave ausente.
- Correção sugerida: quando o ponto em aberto 2 for decidido, falhar na subida se o valor for nulo ou negativo (`@PostConstruct` que lança `IllegalStateException`, ou `@ConfigurationProperties` com `@Validated` e `@NotNull @PositiveOrZero`) e fixar isso em `ShippingServiceTest`. Esforço pequeno.
- Se nada for feito: Prós: segue o padrão atual (o projeto não valida propriedades). · Contras: um erro de configuração vira total negativo ou 500 em produção, e a entrega 5 vai congelar esse valor no pedido.

#### CR-13 · `MONEY_SCALE` duplicado em dois services
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:12` e `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:40`
- Evidência: as duas classes declaram `private static final int MONEY_SCALE = 2;`. Isso amplia o TD-7 ("literais repetidos no backend"), débito conhecido.
- Correção sugerida: junto com o TD-7, pôr a escala do dinheiro numa constante única, reaproveitada pelo carrinho e pelo pedido da entrega 5. Esforço pequeno.
- Se nada for feito: Prós: cada service continua autocontido. · Contras: se a escala mudar, é fácil esquecer um dos dois lugares, e o `total` mistura valores feitos com constantes diferentes.

#### CR-14 · Specs e macroplano ainda dizem "sem frete"
- Severidade: baixa
- Veredito: tolerável (até o `/erudio:complete-story`)
- Local: `docs/specs/frontend/05-telas-e-modulos.md:46` (e `:45`), `docs/specs/frontend/07-alinhamento-do-app-atual.md:40`, `docs/specs/backend/03-modelo-de-dados-e-migracoes.md:60`, `docs/specs/backend/05-modulos.md:51`, `docs/plans/macroplano-geek-shopping.md:80` e `:97`
- Evidência: o código e o guardrail (`SKILL.md:150`) já mostram a linha Shipping, mas as specs dizem "sem frete e sem campo de cupom" (`frontend/05`), "Sem frete … Remover a linha de frete" (B8), "Sem frete." (`backend/03`) e `total = subtotal − discount` (`backend/05`). É o ponto em aberto 5 da própria história.
- Correção sugerida: atualizar cada linha: carrinho com `shipping` e `total = subtotal + shipping`; B8 como "frete vindo do servidor"; `Order.total = subtotal + shipping − discount`, com o frete gravado no pedido (RN-8). Esforço pequeno.
- Se nada for feito: Prós: nenhuma mudança agora. · Contras: a próxima história (checkout ou pedido) será planejada sobre specs que contradizem o código.

#### CR-15 · Duas asserções de `CartServiceTest` verificam o stub, não o `CartService`
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/test/java/br/com/erudio/unittests/services/CartServiceTest.java:71` (stub leniente que replica a regra), `:691` (`clearedCartHasNoShipping`) e `:767` (`convertedCartKeepsItsShipping`)
- Evidência: os dois testes afirmam `shipping` 0,00 e 10,00, mas os valores saem do stub; nenhum faz `verify(shippingService).calculate(0)` ou `calculate(1)`. Se o `CartService` passasse um `itemCount` errado mas positivo, os dois continuariam verdes. Já `emptyCartHasNoShipping`, `addItemAnswersWithShippingAndTotal` e `updateItemAnswersWithShippingAndTotal` verificam o argumento.
- Correção sugerida: acrescentar `verify(shippingService).calculate(0)` (depois do `clear`) e `verify(shippingService).calculate(1)`. Esforço pequeno.
- Se nada for feito: Prós: a regra está coberta por `ShippingServiceTest` e pela integração. · Contras: esses dois testes parecem cobrir o repasse da quantidade e não cobrem.

#### CR-16 · `@BeforeAll` vazio na classe base cujo efeito é implícito
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/ApiIntegrationTest.java:15-16`
- Evidência: `@BeforeAll static void startTheApplication(ApplicationContext context) {}` não faz nada; o efeito vem de o `SpringExtension` resolver o parâmetro, o que sobe o contexto antes dos `@BeforeAll` estáticos das subclasses. A correção é legítima (conserta a dependência de ordem de `CartControllerJsonTest:28` e `CartControllerErrorsJsonTest:32`), mas muda a base de todas as classes de integração e parece código morto.
- Correção sugerida: sem comentários (regra do projeto), deixar a intenção no código, por exemplo um corpo com `assertNotNull(context)`, ou registrar o motivo em `## Implementado`. Esforço pequeno.
- Se nada for feito: Prós: funciona e o nome já sugere a intenção. · Contras: se alguém remover o método vazio, as classes do carrinho voltam a falhar quando rodam isoladas.

#### CR-17 · Nos testes de front, a quantidade do `GET` depende do valor do frete
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/components/feature/Cart/__test__/Cart.test.tsx:111` e `geek-shopping-app/hooks/__test__/useCart.test.tsx:126`
- Evidência: `quantity: shipping === 10 ? 1 : 2`; a variável `shipping` faz o papel de "já houve PUT", juntando dois conceitos, e se o valor inicial mudar a quantidade muda junto.
- Correção sugerida: usar uma variável própria (`let quantity = 1`, atualizada no handler do `PUT`) ou reaproveitar `serveCart` com o frete como parâmetro. Esforço pequeno.
- Se nada for feito: Prós: os testes provam o que devem (o front mostra o frete e o total que o servidor manda). · Contras: manutenção mais frágil.

**Não verificado:** nenhuma suíte foi executada (`./mvnw test`, `npx vitest run`, `npm run e2e`); o comportamento de `shipping.flat-rate` vazio (CR-12) foi deduzido do editor numérico do Spring; não houve conferência visual na tela (fidelidade ao MultiShop checada só pela marcação e pelo CSS); a integração confere zeros com `compareTo`, que não distingue `0` de `0.00` (a escala 2 com zero é coberta só por `ShippingServiceTest.noItemsNoShipping`). Pergunta do revisor, não achado: o seletor do E2E (`e2e/cart.spec.ts:12-13`, `span` filtrado por texto e `xpath=..`) depende da estrutura do DOM do resumo, e nenhuma spec define a forma certa de seletor de E2E; vale decidir se padroniza (por exemplo `getByRole` ou `data-testid`).

**Resumo:**
- Por severidade: alta 0 · média 0 · baixa 6 (CR-12 a CR-17).
- Por veredito: precisa corrigir 0 · tolerável 6.
- Por classe: novos 6 (CR-13 amplia o TD-7, conhecido). Nenhum achado anterior piorou.

### Performance

Executado em 31/10/2026 10:08 pelo agente `erudio:perf-reviewer` (somente leitura; nada foi executado nem medido). Escopo: 4 arquivos de produção do backend e o `application.yml`, mais 6 arquivos do frontend; nenhuma migration (D-5).

**Resultado: nenhum achado novo (nenhum PF-5).** A história não acrescenta consulta, escrita, índice, rota nem dependência. O custo novo por leitura do carrinho é constante e muito pequeno: uma chamada de método, uma soma de `BigDecimal` e um campo a mais no JSON. Também não muda o que re-renderiza no front.

**Escopo analisado:** a história `frete-do-carrinho` (Contexto, RN, AC, Backend, Frontend, Implementado, Code Review e Alertas); `ShippingService`, `CartService` e `useCart` lidos inteiros; `CartDTO`, `CartControllerDocs`, `application.yml`, `models/cart.ts`, `api/cart.ts`, `Cart.tsx` e `Checkout.tsx` pelo diff contra o `HEAD`; `useCartCount` e o uso em `Header.tsx:31` por busca.

**Backend: fetch e N+1:** checado, sem achados. `CartService.toDto` (`CartService.java:181-198`) faz uma única chamada a `shippingService.calculate(itemCount)` na linha 192, fora do laço dos itens, usando a contagem que o laço já calculava (linha 189); não há consulta nem acesso lazy novo. `ShippingService` (`ShippingService.java:9-21`) é um singleton sem estado mutável: um `BigDecimal` imutável injetado uma vez por `@Value`, sem I/O, sem cache e sem `@Transactional`.
**Backend: paginação, filtros e ordenação:** checado, sem achados (nenhuma listagem nem consulta nova).
**Backend: índices e migrations:** checado, sem achados (nenhuma migration e nenhum predicado novo).
**Backend: dados pesados e consultas:** checado, sem achados. Custo novo por resposta: `BigDecimal.ZERO.setScale(2)` aloca um objeto com o carrinho vazio (`ShippingService.java:18`); `flatRate.setScale(2, HALF_UP)` com itens (linha 19), que com a mesma escala deve devolver o próprio objeto (não medido); um `subtotal.add(shipping)` (`CartService.java:195`); tudo em tempo constante, independente do número de itens. O payload ganha um campo numérico de cerca de 15 a 20 bytes. Nada é gravado (D-5, RN-6): o frete é recalculado a cada leitura sem ir ao banco.
**Frontend: dados:** checado, sem achados. A query key continua `cartKeys.all` (`useCart.ts:10`); `staleTime`, `retry`, invalidação e mutações não mudaram; `shipping ?? 0` roda uma vez por resposta, no `queryFn`; o front não soma nenhum total.
**Frontend: renderização e bundle:** checado, sem achados. O retorno de `useCart` (`useCart.ts:15-24`) ganhou um primitivo e já era um objeto novo a cada render; `shipping` só muda junto com `data` (e quando passa de 0 para o valor fixo, `itemCount` muda junto), então não há gatilho novo de re-render; o contador do Header (`useCartCount.ts:4`, `Header.tsx:31`) re-renderiza como já fazia; cada tela ganhou uma `div` de resumo, sem lista nova, sem import nem biblioteca nova.

**Achados anteriores (PF-1 a PF-4):** nenhum piorou. PF-3 (DTO montado nas operações 204): `removeItem` e `clear` passam por `save` e `toDto`, que agora também chama `calculate`, acréscimo desprezível diante do mapeamento e dos links HATEOAS já existentes (segue `conhecido`). PF-1, PF-2 e PF-4 não são tocados; o `GET` extra do PF-4 agora traz um campo a mais, sem efeito relevante.

**Não verificado (precisa de medição):**
- Que `setScale` com a mesma escala devolve o próprio objeto no JDK 25 em uso.
- O custo real por requisição de `toDto` com o frete (nanossegundos, sem medição).
- O número de re-renders de `Cart`, `Checkout` e `Header` antes e depois (precisaria do React Profiler).
- O tamanho do bundle antes e depois (a expectativa é diferença zero, mas não houve comparação do `next build`).

**Resumo:**
- Por severidade: alta 0 · média 0 · baixa 0.
- Por veredito: precisa corrigir 0 · tolerável 0.
- Conhecidos: PF-3 e PF-4, revistos e sem piora.

### Segurança

Executado em 31/10/2026 10:12 pelo agente `erudio:security-reviewer` (somente leitura; nenhum valor de segredo é registrado aqui). Escopo: 7 arquivos do backend, os dois `application.yml` (só as chaves), 5 arquivos do frontend e os nomes dos arquivos `.env*`. Os números de linha do achado foram conferidos no código (`CartService.java:184`, `:189`, `:192`; `ShippingService.java:17-19`).

**Resultado:** 1 achado novo, SEC-5, `baixa` e `tolerável`, marcado `[segurança]` por mexer no total. Nenhum achado `alta`, nenhum segredo novo e nenhuma forma de o cliente mandar o frete ou o total.

**Escopo analisado:** a história `frete-do-carrinho` inteira (com os reviews de código e de performance); `ShippingService`, `CartService`, `CartDTO`, os dois DTOs de entrada e `CartController` inteiros; `CartControllerDocs` pelo diff; `application.yml` principal inteiro e o de teste por diff e busca de chaves; como evidência, `ProductRequestDTO` (limites de `price` e `quantity`), `Product` (colunas) e `CartShippingJsonTest.java:163-183`; frontend: `models/cart.ts`, `api/cart.ts`, `useCart.ts`, `Cart.tsx`, `Checkout.tsx` (diffs e busca) e o uso de `localStorage` em `useCartTokenStore.ts`; só os nomes das chaves de `.env.example` e `.env.local`.

**Validação e mass assignment:** checado, sem achados. Os DTOs de entrada só têm `productId`, `quantity`, `color` e `size` (`CartItemRequestDTO.java:15-27`) ou só `quantity` (`CartItemQuantityRequestDTO.java:13-15`); não existe campo `shipping` nem `total` para preencher; `toDto` monta os dois só a partir do banco e da configuração (`CartService.java:192-195`); o Jackson descarta propriedades desconhecidas, provado por `CartShippingJsonTest.java:163-183` (envia `shipping: 0` e `total: 1` no `POST` e no `PUT` e confere que foram ignorados); nenhum parâmetro de consulta novo.
**Injeção:** checado, sem achados (nenhuma `@Query` nova nem entrada nova que chegue a uma consulta).
**Tratamento de erros e vazamento de informação:** checado, sem achados. Chave `shipping.flat-rate` ausente ou não numérica falha na subida e aparece só no log do servidor; chave vazia (valor `null`, 500 na primeira leitura) já é o CR-12; os logs novos não têm dado pessoal nem o token (`CartService.java:53` é fixo).
**CORS e transporte:** checado, sem achados (nada mudou: `application.yml:9-10` continua com `localhost:8080` e `:3000`).
**Upload:** não se aplica (a história não tem endpoint de arquivo).
**Segredos:** checado, sem achados novos. A única chave nova é `shipping.flat-rate` (`application.yml:6-7` no principal e `:9-10` no de teste), valor público de regra de negócio; a senha do datasource (`application.yml:19`, `[valor omitido]`) é o débito conhecido de `backend/07`, que a história não toca; `.env.local` não é versionado (`git ls-files` vazio) e o front só tem `NEXT_PUBLIC_API_URL` e `PORT`.
**Regras de negócio contornáveis:** SEC-5. Também checado: a soma `subtotal + shipping` em `BigDecimal` não estoura (`@Digits(integer = 9, fraction = 2)` e coluna `precision = 65`); o arredondamento `HALF_UP` só age sobre o valor da configuração (`ShippingService.java:19`); o frete é recalculado a cada leitura e não é gravado (D-5); o carrinho `CONVERTED` segue bloqueado para escrita (`ensureOpen`, `CartService.java:167-169`).
**Exposição no frontend:** checado, sem achados. Valores renderizados como texto pelo React com `formatPrice` (`Cart.tsx:125-133`, `Checkout.tsx:158-166`), sem `dangerouslySetInnerHTML`; o front não soma nada (`total` vem do servidor, `cart.ts:49`; `shipping ?? 0` só cobre resposta sem o campo); o checkout não envia valor algum; `localStorage` guarda só o token do carrinho; nenhuma dependência nem `NEXT_PUBLIC_*` novo.

#### SEC-5 · [segurança] Estouro de `itemCount` (int) zera o frete
- Severidade: baixa
- Veredito: tolerável (corrigir antes de a entrega 5 congelar o frete no pedido)
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:189` (`itemCount += item.getQuantity();`, com `var itemCount = 0` em `:184`, ou seja, `int`), que alimenta `CartService.java:192` (`shippingService.calculate(itemCount)`); em `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:18`, `if (itemCount <= 0) return BigDecimal.ZERO...` devolve frete 0 quando a soma fica negativa
- Evidência: cada linha é limitada só pelo estoque do produto (`ensureStock`, `CartService.java:171-174`), e o estoque é um `Integer` sem teto (`ProductRequestDTO`, `@PositiveOrZero`); a soma das linhas é `int` sem `Math.addExact`. Antes desta história o estouro só deixava `itemCount` errado na tela; agora ele decide o frete, porque `calculate` trata contagem `<= 0` como carrinho vazio. O `subtotal` em `BigDecimal` continua certo, então o efeito é perder exatamente o frete.
- Cenário: (1) existem dois produtos com estoque de 2.000.000.000 cada (os endpoints de produto são abertos por decisão, então qualquer um consegue deixar o estoque assim); (2) um cliente anônimo faz `POST /api/cart/v1/items` com 1.100.000.000 unidades do produto A e depois do produto B; (3) `itemCount` vira 2.200.000.000 − 2^32 = −2.094.967.296; (4) `shipping` sai 0,00 e `total` sai igual ao `subtotal`: o carrinho fica sem frete. Hoje o ganho é desprezível (R$ 10 sobre um subtotal enorme, e não existe pedido); o risco real é a entrega 5 reaproveitar `calculate(itemCount)` como manda o plano e gravar esse 0 no pedido.
- Correção sugerida: somar a contagem em `long` com `Math.addExact`, ou decidir o frete por "o carrinho tem linhas" (`!cart.getItems().isEmpty()`) em vez da soma das unidades, que casa com a RN-2 (frete fixo por carrinho não vazio); opcionalmente um teto em `quantity` nos DTOs de entrada (`@Max`); fixar o caso em `ShippingServiceTest` e `CartServiceTest`. Esforço pequeno.
- Se nada for feito: Prós: exige estoques e quantidades absurdas, e o prejuízo por carrinho é só o valor do frete. · Contras: o pedido da entrega 5 pode herdar o cálculo e gravar frete 0 de um jeito que o cliente controla; além disso, `itemCount` negativo continua aparecendo na resposta e no contador do Header.

**Casos `conhecido`, sem achado novo:** CR-12 (frete negativo ou vazio na configuração): só o operador escreve o `application.yml`, o cliente não tem como influenciar; nota para a entrega 5: com frete negativo o total sai menor que o subtotal, até zero ou negativo, então validar `>= 0` na subida antes de o pedido congelar o valor. SEC-3 (linhas duplicadas contra o estoque): não muda o frete, que é fixo por carrinho; com linhas duplicadas, só aumenta a chance do estouro do SEC-5. SEC-1, SEC-2 e SEC-4 não são tocados por esta história.

**Não verificado:** nada foi executado; o estouro do SEC-5 foi deduzido da aritmética de `int` em Java e do caminho do código, sem rodar. Não foi conferido se o Jackson 3 no Spring Boot 4.1 tem `FAIL_ON_UNKNOWN_PROPERTIES` desligado por configuração: não há ajuste explícito em `src/main`, e a conclusão se apoia no teste `CartShippingJsonTest.java:163-183`, que a história registra como verde. As specs `backend/02, 03, 04, 05, 07` e `frontend/02, 03, 04, 07` e os `CLAUDE.md` dos dois projetos não foram lidos por inteiro. Não foi conferido se `formatPrice` lida com número negativo ou `NaN`, o que só importaria junto com o CR-12.

**Resumo:**
- Por severidade: alta 0 · média 0 · baixa 1 (SEC-5).
- Por veredito: precisa corrigir 0 · tolerável 1 (SEC-5, a corrigir antes da entrega 5).
- Conhecidos revistos, sem piora: CR-12 (ganha a nota de segurança sobre o pedido), SEC-3 e a senha do datasource (débito de `backend/07`); SEC-1, SEC-2 e SEC-4 não são tocados.

### Tech debt

Varredura final executada em 31/10/2026 10:15 pelo agente `erudio:tech-debt-reviewer` (somente leitura; nada foi compilado nem executado). Tudo o que já constava em `## Alertas e débitos técnicos` (CR-12 a CR-17, SEC-5) e os achados abertos da história anterior (CR-1 a CR-11, PF-1 a PF-4, SEC-1 a SEC-4 e TD-2 a TD-11 de `carrinho-de-compras-com-token-de-convidado`) foram tratados como `conhecido` e não são repetidos. Os achados novos desta história começam em TD-1.

**Escopo analisado:** backend: `ShippingService` e `CartService` inteiros, `CartDTO`, `CartControllerDocs` e `SwaggerIntegrationTest` por diff e busca, os dois `application.yml` (só a chave `shipping`; o resto do yml de teste não foi comparado com o principal), `ShippingServiceTest`, `CartShippingJsonTest` e `ApiIntegrationTest` inteiros, `CartServiceTest` em `:62-80` e por busca de `shipping`/`verify`, `CartControllerJsonTest` e `CartLifecycleJsonTest` por busca dos valores monetários; frontend: `app/core/api/cart.ts`, `useCart.ts`, `test/fixtures.ts`, `test/msw/serveCart.ts` e `e2e/cart.spec.ts` inteiros, `Cart.tsx` em `:118-137`, `Checkout.tsx` e os testes de cart, hook, Cart e Checkout por busca de literais; documentos: `geek-shopping-app/CLAUDE.md`, linha 150 do `SKILL.md`, `geek-shopping-api/CLAUDE.md`, busca em `README.md` e `ARCHITECTURE.md` do app e em `docs/specs`, e a história anterior por busca; a história `frete-do-carrinho` inteira.

**Duplicação e código morto:** TD-1, TD-2, TD-3 e TD-4. A duplicação de `MONEY_SCALE` é o CR-13 e o stub de `CartServiceTest` é o CR-15 (ambos conhecidos). Não há código morto: o padrão de `shipping` em `buildCartResponse` (`fixtures.ts:137`) é usado por `serveCart`, e `FLAT_SHIPPING` só é usado dentro de `fixtures.ts`, mas é exportado e o padrão depende dele.
**Acoplamento e camadas:** checado, sem achados. `ShippingService` só tem a regra e `CartService.toDto` só compõe (`CartService.java:192-195`); o front só repassa valores do servidor (`useCart.ts:19`, `Cart.tsx:129`, `Checkout.tsx:161-162`) e a direção de dependência está preservada.
**Violações de spec:** TD-5, além do CR-14.
**Marcadores e hacks permanentes:** checado, sem achados. Sem `TODO`, `FIXME`, `HACK` nem `XXX`; a única URL fixa é `API_URL = 'http://api.test'` em `fixtures.ts:3`, de teste.
**Tratamento de erros:** checado, sem achados novos (frete negativo ou vazio é o CR-12; estouro de `itemCount` é o SEC-5).
**Valores mágicos e configuração:** checado, sem achados novos. O `@Value("${shipping.flat-rate}")` sem padrão (`ShippingService.java:14`) e a chave `shipping.flat-rate: 10.00` nos dois yml (`application.yml:6-7` no principal, `:9-10` no de teste) batem; o valor vive só nos yml e o padrão não é duplicado no código, o que evita um novo TD-7. `MONEY_SCALE` duplicado é o CR-13.
**Dependências:** checado, sem achados (nenhuma dependência nova).
**Testes:** TD-1, TD-2 e TD-3; o resto é conhecido (CR-15, CR-16 e CR-17). `ShippingServiceTest` usa `@ExtendWith(MockitoExtension.class)` e `@InjectMocks` numa classe sem mocks, o que segue o padrão de `CartCleanupServiceTest` e não é achado; `flatRateIgnoresTheQuantity` inclui `Integer.MAX_VALUE` (`ShippingServiceTest.java:54`) sem colidir com o SEC-5; nenhum teste `@Disabled`, vazio ou sem asserção; `CartShippingJsonTest` usa token e carrinho por teste, sem ordem dependente nem estado compartilhado.

#### TD-1 · Testes de integração antigos fixam o frete em literais, enquanto o teste novo lê a configuração
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/controllers/withjson/CartControllerJsonTest.java:80,116,128,163` e `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/controllers/withjson/CartLifecycleJsonTest.java:83`
- Evidência: `assertMoney("60.00", cart.getTotal())`, `"175.00"` e `"70.00"` embutem os 10,00 do frete na soma, enquanto `CartShippingJsonTest.java:47-49` deriva o frete de `environment.getProperty("shipping.flat-rate")`. Se `shipping.flat-rate` mudar no yml de teste, a classe nova continua verde e as duas antigas quebram. Amplia o TD-7 conhecido da história anterior.
- Correção sugerida: nos dois testes antigos, calcular o esperado como `subtotal + frete configurado`, ou expor um helper em `CartApi` como `assertTotal(cart)` (o `assertTotalIsSubtotalPlusShipping` de `CartShippingJsonTest` pode ir para o `CartApi`). Esforço pequeno.
- Se nada for feito: Prós: os valores literais deixam o teste legível. · Contras: mudar o frete de teste exige editar 5 asserções espalhadas.

#### TD-2 · Os testes de front repetem `10` e `R$ 10,00` em vez de usar `FLAT_SHIPPING` da fixture
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/test/fixtures.ts:135` (definição); literais em `geek-shopping-app/app/core/api/__test__/cart.test.ts:54,106-109`, `hooks/__test__/useCart.test.tsx:50,123,126,130`, `components/feature/Cart/__test__/Cart.test.tsx:54,108,111` e `components/feature/Checkout/__test__/Checkout.test.tsx:56`
- Evidência: `FLAT_SHIPPING = 10` é exportado, mas nenhum teste o importa; cada teste repete `toBe(10)`, `total).toBe(subtotal + 10)`, `/R\$\s?10,00/` ou `let shipping = 10`. O CR-17 cobre só o `shipping === 10 ? 1 : 2`.
- Correção sugerida: importar `FLAT_SHIPPING` nas asserções e, para o texto formatado, usar `formatPrice(FLAT_SHIPPING)` ou uma constante de teste. Esforço pequeno.
- Se nada for feito: Prós: cada teste lê como exemplo fixo. · Contras: se o valor da fixture mudar, 4 arquivos precisam de ajuste manual e a constante exportada fica sem função.

#### TD-3 · O E2E fixa `R$ 10,00` e `toBe(10)` sem relação com a configuração da API
- Severidade: baixa
- Veredito: tolerável
- Classe: novo (relacionado ao TD-11 da história anterior, que cobre a dependência do seed)
- Local: `geek-shopping-app/e2e/cart.spec.ts:125,129,144,157`
- Evidência: `toContainText(/R\$\s*10,00/)` aparece 3 vezes e `expect(shipping).toBe(10)` uma vez, mas o valor vem de `shipping.flat-rate` do `application.yml` da API que estiver no ar, que é configurável (RN-2); um ambiente com outro valor quebra o E2E, embora o teste só precise provar `total = subtotal + shipping` (já feito nas linhas 126-130). Os seletores `summaryRow` (linhas 12-14) usam `xpath=..`, o que o code review já levantou como pergunta.
- Correção sugerida: tirar as duas asserções fixas de 10 e comparar com um `SHIPPING` único no topo do arquivo, com a pré-condição documentada, ou ler o frete da própria tela. Esforço pequeno.
- Se nada for feito: Prós: o teste é explícito. · Contras: acopla o E2E ao yml e repete o literal 4 vezes.

#### TD-4 · O adaptador trata `shipping` como opcional, mas o contrato do servidor sempre o envia
- Severidade: baixa
- Veredito: tolerável
- Classe: novo
- Local: `geek-shopping-app/app/core/api/cart.ts:22` (`shipping?: number`) e `:48` (`response.shipping ?? 0`)
- Evidência: `subtotal` e `total` são obrigatórios em `CartResponse`, só `shipping` é opcional, e o `CartDTO` do backend sempre o preenche (RN-5). Se a API deixar de mandar o campo, a tela mostra `R$ 0,00` em silêncio e o `total` do servidor deixa de bater com as linhas exibidas, em vez de falhar visivelmente. O plano prevê o fallback ("resposta sem shipping vira 0"), por isso é só limpeza.
- Correção sugerida: tornar o campo obrigatório na interface e tirar o `?? 0` (ou manter e registrar a decisão), removendo o teste "resposta sem o campo" se o fallback sair. Esforço pequeno.
- Se nada for feito: Prós: tolera backend antigo durante a migração. · Contras: defende de um estado que o contrato não permite e esconde quebra de contrato.

#### TD-5 · Documentos que ainda dizem "sem frete" ou "total = subtotal" fora da lista do CR-14
- Severidade: baixa
- Veredito: tolerável (até o `/erudio:complete-story`)
- Classe: novo (complementa o CR-14)
- Local: `docs/specs/frontend/03-dados-e-contrato-com-a-api.md:57`, `docs/specs/backend/06-qualidade-e-testes.md:56`, `docs/plans/stories/carrinho-de-compras-com-token-de-convidado.md:67` (RN-8), `:151` (AC-9), `:159` (AC-17) e `:215`
- Evidência: o CR-14 lista `frontend/05`, `frontend/07` B8, `backend/03`, `backend/05` e o macroplano. Os pontos acima também contradizem o código: `frontend/03:57` descreve o `Order` sem `shipping`, `backend/06:56` descreve o carrinho sem o frete, e a história anterior diz `total = subtotal` sem nota de que foi substituída por `frete-do-carrinho`. Ela é histórico fechado, então a correção mais barata é uma nota, não reescrever a regra.
- Correção sugerida: incluir esses pontos na mesma passada do CR-14 e acrescentar uma linha "RN-8 substituída por `frete-do-carrinho`" na história anterior. Esforço pequeno.
- Se nada for feito: Prós: o histórico fica intacto. · Contras: quem ler a história anterior ou `backend/06` entende que não há frete.

Documentos conferidos e em dia: `SKILL.md` (`:150` já traz Shipping entre Subtotal e Total) e `geek-shopping-app/CLAUDE.md` ("subtotal, shipping and total come from the API"). `README.md` e `ARCHITECTURE.md` do app não mencionam frete (cai no TD-2 conhecido da história anterior). `geek-shopping-api/CLAUDE.md` ainda descreve só o domínio `Product` (TD-4 conhecido da história anterior).

**Resumo:**
- Por severidade: alta 0 · média 0 · baixa 5 (TD-1 a TD-5).
- Por veredito: precisa corrigir 0 · tolerável 5.
- Por classe: novo 5 (TD-3 relacionado ao TD-11 conhecido; TD-5 complementa o CR-14) · conhecido 0 (os conhecidos não foram repetidos).
- Não verificado: nenhuma suíte foi executada; por busca, `FLAT_SHIPPING` só é usado dentro de `fixtures.ts` neste escopo.

## Alertas e débitos técnicos

| ID | Origem | Severidade | Veredito | Local | Resumo | Status |
|---|---|---|---|---|---|---|
| CR-12 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:14` | `shipping.flat-rate` não é validado: negativo gera total menor que o subtotal e valor vazio pode virar 500 em vez de falhar na subida. | Aberto |
| CR-13 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:12` | `MONEY_SCALE` duplicado em `ShippingService` e `CartService` (amplia o TD-7). | Aberto |
| CR-14 | Code Review | baixa | tolerável | `docs/specs/frontend/05-telas-e-modulos.md:46` | Specs e macroplano ainda dizem "sem frete" (frontend/05 e 07, backend/03 e 05, macroplano). | Aberto |
| CR-15 | Code Review | baixa | tolerável | `geek-shopping-api/src/test/java/br/com/erudio/unittests/services/CartServiceTest.java:691` | Dois testes verificam o stub do frete e não o repasse da quantidade (falta `verify(...).calculate(n)`). | Aberto |
| CR-16 | Code Review | baixa | tolerável | `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/ApiIntegrationTest.java:15` | `@BeforeAll` vazio na base de integração cujo efeito é implícito; pode ser apagado por engano. | Aberto |
| CR-17 | Code Review | baixa | tolerável | `geek-shopping-app/components/feature/Cart/__test__/Cart.test.tsx:111` | A quantidade do `GET` depende do valor do frete nos testes de front (`shipping === 10 ? 1 : 2`). | Aberto |
| SEC-5 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:189` | [segurança] Estouro de `itemCount` (int) faz `calculate` receber contagem negativa e zerar o frete; corrigir antes de o pedido (entrega 5) congelar o frete. | Aberto |
| TD-1 | Tech debt | baixa | tolerável | `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/controllers/withjson/CartControllerJsonTest.java:80` | Testes de integração antigos fixam o frete em literais (60.00, 175.00, 70.00) enquanto o teste novo lê a configuração (novo). | Aberto |
| TD-2 | Tech debt | baixa | tolerável | `geek-shopping-app/test/fixtures.ts:135` | Testes de front repetem 10 e R$ 10,00 em vez de usar `FLAT_SHIPPING` (novo). | Aberto |
| TD-3 | Tech debt | baixa | tolerável | `geek-shopping-app/e2e/cart.spec.ts:125` | E2E fixa R$ 10,00 e `toBe(10)` sem relação com a configuração da API (novo; relacionado ao TD-11 da história anterior). | Aberto |
| TD-4 | Tech debt | baixa | tolerável | `geek-shopping-app/app/core/api/cart.ts:22` | O adaptador trata `shipping` como opcional, mas o servidor sempre o envia; o `?? 0` esconde quebra de contrato (novo). | Aberto |
| TD-5 | Tech debt | baixa | tolerável | `docs/specs/frontend/03-dados-e-contrato-com-a-api.md:57` | Documentos ainda dizem "sem frete" ou "total = subtotal" fora da lista do CR-14 (frontend/03, backend/06, história anterior) (novo). | Aberto |

## Fechamento

Encerrada em 31/10/2026 10:17, por decisão explícita do usuário ("Encerrar a história"). As dez etapas anteriores estão ✅; a varredura de débito técnico (`### Tech debt`) foi registrada em 31/10/2026 10:14. Nenhum achado `alta` nem `média` está aberto, e nenhum está marcado `precisa corrigir`.

### Critérios de aceite

| AC | Evidência | Situação |
|---|---|---|
| AC-1 | `CartShippingJsonTest` (`addingAnItemChargesTheConfiguredShippingAndAddsItToTheTotal`, `theTotalIsAlwaysTheSubtotalPlusTheShippingOnEveryOperation`), `CartServiceTest` (`totalsAreComputedByTheServer`), `CartControllerJsonTest` e `CartLifecycleJsonTest` com o total ajustado | evidenciado |
| AC-2 | `CartShippingJsonTest` (`aNewTokenHasNoShippingAndNothingIsStored`, `clearingTheCartDropsTheShipping`, `removingAnItemKeepsTheShippingWhileThereAreItemsAndDropsItWithTheLastOne`), `CartServiceTest` (`emptyCartHasNoShipping`, `clearedCartHasNoShipping`) | evidenciado |
| AC-3 | `CartShippingJsonTest` (`theShippingIsTheSameForAnyQuantityAndAnyNumberOfProducts`), `ShippingServiceTest` (`flatRateIgnoresTheQuantity`) | evidenciado |
| AC-4 | `CartShippingJsonTest` (`theTotalIsAlwaysTheSubtotalPlusTheShippingOnEveryOperation`, `updatingTheQuantityKeepsTheShippingAndRecomputesTheTotal`), `CartServiceTest` (`addItemAnswersWithShippingAndTotal`, `updateItemAnswersWithShippingAndTotal`) | evidenciado |
| AC-5 | `CartShippingJsonTest` (`aShippingOrTotalSentInTheBodyOfAnAddIsIgnored`, `aShippingOrTotalSentInTheBodyOfAnUpdateIsIgnored`); os DTOs de entrada não têm o campo | evidenciado |
| AC-6 | `ShippingServiceTest` (`anotherConfiguredValue`, `alwaysTwoDecimalPlaces`, `roundsHalfUp`), `CartShippingJsonTest` (`theTestConfigurationChargesTenByDefault`, valor lido de `shipping.flat-rate`) | evidenciado |
| AC-7 | `SwaggerIntegrationTest` (`theCartSchemaDocumentsTheSubtotalTheShippingAndTheTotal`, `theCartOperationsSayThatTheResponseCarriesTheShippingAndTheTotal`) | evidenciado |
| AC-8 | `Cart.test.tsx` (ordem Subtotal, Shipping e Total no DOM; frete e total do servidor mesmo quando diferem da soma local; frete 0,00; atualização após mudar a quantidade), `useCart.test.tsx`, `cart.test.ts`; falta a conferência visual e o E2E não foi executado | evidenciado |
| AC-9 | `Checkout.test.tsx` (linha Shipping e total do servidor, inclusive quando diferem da soma local); falta a conferência visual e o E2E não foi executado | evidenciado |
| AC-10 | `Cart.test.tsx` (sem resumo e sem Shipping carregando, vazio e com erro); no Checkout, o erro do carrinho ainda aparece como "carrinho vazio" (CR-1 da história anterior, sem piora) | parcial |
| AC-11 | Back: `./mvnw test` com 438 testes verdes; front: `vitest` com 453 verdes, `tsc` e `lint` sem erros; os testes e o guardrail que diziam "sem frete" foram atualizados (`SKILL.md:150`) | evidenciado |

Resumo: 10 evidenciados, 1 parcial, 0 sem evidência.

### Achados e débitos em aberto

Nenhum `Corrigido`, `Aceito` nem `Contestado`. Abertos nesta história: 0 `alta`, 0 `média`, 12 `baixa` (todas `tolerável`, nenhuma `precisa corrigir`).

| ID | Origem | Local | Resumo |
|---|---|---|---|
| CR-12 | Code Review | `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:14` | `shipping.flat-rate` não é validado: negativo gera total menor que o subtotal e valor vazio pode virar 500. |
| CR-13 | Code Review | `geek-shopping-api/src/main/java/br/com/erudio/services/ShippingService.java:12` | `MONEY_SCALE` duplicado em `ShippingService` e `CartService`. |
| CR-14 | Code Review | `docs/specs/frontend/05-telas-e-modulos.md:46` | Specs e macroplano ainda dizem "sem frete". |
| CR-15 | Code Review | `geek-shopping-api/src/test/java/br/com/erudio/unittests/services/CartServiceTest.java:691` | Dois testes verificam o stub, não o repasse da quantidade. |
| CR-16 | Code Review | `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/ApiIntegrationTest.java:15` | `@BeforeAll` vazio com efeito implícito. |
| CR-17 | Code Review | `geek-shopping-app/components/feature/Cart/__test__/Cart.test.tsx:111` | A quantidade do `GET` nos testes depende do valor do frete. |
| SEC-5 | Segurança | `geek-shopping-api/src/main/java/br/com/erudio/services/CartService.java:189` | [segurança] Estouro de `itemCount` (int) zera o frete; corrigir antes de o pedido congelar o frete. |
| TD-1 | Tech debt | `geek-shopping-api/src/test/java/br/com/erudio/integrationtests/controllers/withjson/CartControllerJsonTest.java:80` | Testes de integração antigos fixam o frete em literais. |
| TD-2 | Tech debt | `geek-shopping-app/test/fixtures.ts:135` | Testes de front repetem `10` e `R$ 10,00` em vez de `FLAT_SHIPPING`. |
| TD-3 | Tech debt | `geek-shopping-app/e2e/cart.spec.ts:125` | E2E fixa `R$ 10,00` sem relação com a configuração da API. |
| TD-4 | Tech debt | `geek-shopping-app/app/core/api/cart.ts:22` | `shipping` opcional no adaptador esconde quebra de contrato. |
| TD-5 | Tech debt | `docs/specs/frontend/03-dados-e-contrato-com-a-api.md:57` | Mais documentos dizem "sem frete" ou "total = subtotal" (frontend/03, backend/06, história anterior). |

Performance: nenhum achado (`### Performance`). Os locais completos, as evidências e as sugestões de cada achado estão nas seções `### Code Review`, `### Segurança` e `### Tech debt`. Continuam abertos também os achados da história anterior (`carrinho-de-compras-com-token-de-convidado`: 29 abertos, 5 `precisa corrigir`), registrados lá.

### Pontos em aberto do plano

Resolvidos: 1 (`shipping.flat-rate: 10.00`, sem padrão no código), 3 (o front mostra R$ 0,00 como qualquer valor) e 6 (as pendências do carrinho ficam fora desta história). Continuam abertos: 2 (validação da configuração, é o CR-12), 4 (o pedido da entrega 5 deve congelar o frete: `Order.total = subtotal + shipping − discount`) e 5 (specs e macroplano a atualizar, é o CR-14 e o TD-5). O ponto 7 (frete grátis acima de um valor e faixas) segue como possível evolução.

### Lacunas aceitas

- O spec E2E `geek-shopping-app/e2e/cart.spec.ts` (12 testes, 4 novos ou reescritos) e o ajuste em `e2e/catalog.spec.ts` não foram executados: exigem a API em `:8080`, o MySQL e o app em `:3000`. Decisão do usuário em 31/10/2026 (etapa de integração).
- A conferência visual da linha Shipping em `/cart` e em `/checkout` contra o `MultiShop` está pendente.

### Decisões do usuário durante a história

- O frete é um valor fixo configurável (`shipping.flat-rate`, padrão R$ 10,00), igual para todo carrinho com itens; carrinho vazio paga 0.
- Back e front: o carrinho devolve `shipping` e `total = subtotal + shipping`, e `/cart` e `/checkout` mostram a linha Shipping.
- Regras confirmadas como propostas: cálculo só no servidor, o cupom não altera o frete e o pedido congelará o valor.
- Fora do escopo: frete por CEP, região, peso ou transportadora, e cupom de frete grátis.
- O plano foi aprovado em 31/10/2026 09:40.
- Fechar a etapa de integração com o E2E sem resultado e encerrar a história com os achados acima em aberto.
- Incidente de processo registrado: nesta história, a base `ApiIntegrationTest` ganhou um `@BeforeAll` que sobe o contexto antes dos `@BeforeAll` das subclasses, para as classes do carrinho rodarem isoladas (CR-16).
