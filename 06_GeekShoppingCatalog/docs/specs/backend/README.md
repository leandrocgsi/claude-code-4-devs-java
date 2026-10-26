# Specs do back-end — geek-shopping-api

Status: **rascunho** (aguardando revisão).

Specs arquiteturais do `geek-shopping-api`, derivadas do [macroplano](../../plans/macroplano-geek-shopping.md). Nível intermediário: arquitetura transversal completa e visão em alto nível de cada módulo. O detalhe fino de cada módulo (campos exatos, queries, casos de teste) fica para o **plano micro**, escrito na hora de implementar.

As convenções vêm das skills `erudio-spring-boot` (`erudio-spring-boot-premium/plugins/erudio-spring-boot/skills/*/SKILL.md`). Estas specs não repetem as skills; citam a regra e dizem onde o projeto a segue, a estende ou diverge.

## Índice

| Arquivo | Assunto |
|---|---|
| [01-visao-e-stack.md](01-visao-e-stack.md) | Objetivo, escopo por entrega, stack, decisões e premissas |
| [02-arquitetura-e-convencoes.md](02-arquitetura-e-convencoes.md) | Pacotes, nomes, estilo de código, camadas, configuração |
| [03-modelo-de-dados-e-migracoes.md](03-modelo-de-dados-e-migracoes.md) | Entidades, relacionamentos, enums, plano de migrations |
| [04-contrato-da-api.md](04-contrato-da-api.md) | Rotas, paginação, filtros, erros, status HTTP, Swagger, HATEOAS |
| [05-modulos.md](05-modulos.md) | Catálogo, carrinho, checkout, pedido, cupom, pagamento simulado |
| [06-qualidade-e-testes.md](06-qualidade-e-testes.md) | Estratégia de testes, estrutura, dependências, critério de pronto |
| [07-alinhamento-do-codigo-atual.md](07-alinhamento-do-codigo-atual.md) | Convenção × código atual × ação |

Ordem de leitura sugerida: 01 → 02 → 03 → 04 → 05 → 06 → 07.

## Pontos em aberto (propostos nas specs, a confirmar)

1. **Status do create:** as specs propõem `201 Created` para criação de recurso. O código atual devolve 200.
2. **`ConflictException` (409):** proposta para estoque insuficiente e transições de estado inválidas. As skills só têm 400 e 404.
3. **Endpoint de checkout:** proposto como validação sem persistência (`POST /api/checkout/v1/validate`). Pode ser dispensado se o front validar só localmente.
4. **Definição de `popularity`:** proposta como unidades vendidas, incrementada na criação do pedido.
5. **Imagens reais do catálogo:** o seed usa URLs fictícias. Ponto em aberto herdado do macroplano.
6. **`ProductRepository.getById`:** exceção documentada no `CLAUDE.md` do projeto, contrária à skill. Decidir no plano micro do catálogo.
7. **Pacote `repositories` e mapper `DozerMapper`:** mantidos como estão, embora a skill cite `repository/` e `ObjectMapper`.

## Alinhamento com as specs do front

Ajustes feitos para as specs do back e do [front](../frontend/README.md) não se contradizerem:

- `Product` ganhou `rating` (nulo) e `review_count` (0), somente leitura, e `sortBy` ganhou `rating` ([03](03-modelo-de-dados-e-migracoes.md), [04](04-contrato-da-api.md), [05](05-modulos.md)).
- Formato JSON de `Product`, `Category` (com `productCount`) e `Address` definido em [04](04-contrato-da-api.md), junto com o payload de `facets` e os corpos de pedido, cupom e pagamento.
- Confirmado que `X-Cart-Token` é aceito pelo CORS e deve ser testado.
- Continuam como propostas, que o front aceita nas duas formas: 201 no create, `ConflictException` (409) e `POST /api/checkout/v1/validate`.

## Glossário

- **Entrega:** cada um dos 7 itens da ordem de entrega do macroplano.
- **Token do carrinho:** UUID gerado no cliente, enviado no header `X-Cart-Token`.
- **Número do pedido:** identificador público e opaco do pedido (UUID), usado nas rotas no lugar do id.
- **Sem login:** não há autenticação nem usuário. Carrinho e pedido têm `customer_id` nulo, reservado para o futuro.
