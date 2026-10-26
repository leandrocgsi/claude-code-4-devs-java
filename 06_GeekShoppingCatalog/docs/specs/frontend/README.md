# Specs do front-end — geek-shopping-app

Status: **rascunho** (aguardando revisão).

Specs arquiteturais do `geek-shopping-app`, derivadas do [macroplano](../../plans/macroplano-geek-shopping.md) e do contrato das [specs do back-end](../backend/README.md). Nível intermediário: arquitetura transversal completa e visão em alto nível das telas de cada módulo. O detalhe fino (campos exatos, estados de cada componente, casos de teste) fica para o **plano micro**, escrito na hora de implementar.

As convenções vêm das skills `erudio-frontend` (`erudio-frontend-premium/plugins/erudio-frontend/skills/*/SKILL.md`) e do guardrail visual do próprio app (`geek-shopping-app/.claude/skills/geek-shopping-app-visual-identity/SKILL.md`). Estas specs citam a regra e dizem onde o app a segue, a estende ou diverge.

## Índice

| Arquivo | Assunto |
|---|---|
| [01-visao-e-stack.md](01-visao-e-stack.md) | Objetivo, escopo por entrega, stack, decisões e premissas |
| [02-arquitetura-e-convencoes.md](02-arquitetura-e-convencoes.md) | Pastas, dependências, convenções, configuração, gates |
| [03-dados-e-contrato-com-a-api.md](03-dados-e-contrato-com-a-api.md) | Camada de dados, adaptador HAL, modelos, erros, pedidos ao back |
| [04-ui-estado-e-design-system.md](04-ui-estado-e-design-system.md) | Estado (Query × Zustand), design system, fidelidade ao MultiShop |
| [05-telas-e-modulos.md](05-telas-e-modulos.md) | Home, `/products`, detalhe, carrinho, checkout, pedido, cupom, pagamento |
| [06-qualidade-e-testes.md](06-qualidade-e-testes.md) | Vitest, Testing Library, MSW, Playwright, critério de pronto |
| [07-alinhamento-do-app-atual.md](07-alinhamento-do-app-atual.md) | App × skills e app × contrato do back |

Ordem de leitura sugerida: 01 → 02 → 03 → 04 → 05 → 06 → 07.

## Decisões do projeto

| Tema | Decisão |
|---|---|
| Detalhe do produto | Página enxuta `/products/[id]`, sem avaliações nem relacionados |
| `/products` | Entra na entrega 2, com filtros, busca, ordenação e paginação no servidor |
| Rating nos cards | Mantido como campo opcional; o back passará a fornecê-lo depois |
| Testes | Vitest + Testing Library + MSW, e E2E com Playwright |
| Login | Fora do escopo; token do carrinho e número do pedido em `localStorage` |

## Pontos em aberto

1. **Estrelas ausentes:** enquanto a API devolver `rating` nulo (não há módulo de avaliações), o card omite o bloco de estrelas (a confirmar).
2. **Propostas do back ainda abertas:** `201` no create, `409`/`ConflictException` e `POST /api/checkout/v1/validate`. O front funciona nas duas formas (ver [03](03-dados-e-contrato-com-a-api.md)).
3. **Imagens reais do catálogo:** o seed do back usa `example.com`; o app hoje usa imagens locais do template.
4. **Idioma da UI:** inglês, como hoje.

## Alinhamento com o back

As specs do back foram corrigidas para não contradizer estas: `rating`/`reviewCount` no produto e `sortBy=rating`, `productCount` na categoria, formato JSON dos DTOs, payload de `facets` e `X-Cart-Token` no CORS. O macroplano também foi atualizado (detalhe enxuto e `/products` na entrega 2). As skills `erudio-frontend` e `erudio-spring-boot` **não** foram alteradas.

## Glossário

- **Entrega:** cada um dos 7 itens da ordem do macroplano (as do front são 2 a 7).
- **Adaptador HAL:** função que converte a resposta HAL do back em modelos internos do app.
- **Token do carrinho:** UUID gerado no cliente, enviado no header `X-Cart-Token`.
- **Número do pedido:** UUID opaco devolvido pelo back; identifica o pedido nas rotas.
