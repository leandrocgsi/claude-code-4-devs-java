# 01 — Visão e stack

## Objetivo

Levar o `geek-shopping-app` de storefront sobre mock para o front de um e-commerce completo, consumindo a API real (`geek-shopping-api`): Home e shop com catálogo vivo, detalhe do produto, carrinho, checkout, pedido, cupom e pagamento simulado. O visual continua sendo o port literal do MultiShop.

## Escopo por entrega

Segue o [macroplano](../../plans/macroplano-geek-shopping.md). A entrega 1 é só do back.

| # | Entrega | Participação do front |
|---|---|---|
| 2 | Listagem na Home | Home e `/products` consumindo a API real (filtros, `facets`, ordenação e paginação no servidor); página `/products/[id]`; remoção do mock |
| 3 | Carrinho | `/cart` e contador do header via API, com `X-Cart-Token` |
| 4 | Checkout | `/checkout` com formulário controlado e validação |
| 5 | Pedido | Criação do pedido, página `/orders/[number]` |
| 6 | Cupom | Campo de cupom na tela do pedido |
| 7 | Pagamento simulado | Escolha do método e pagamento na tela do pedido |

## Fora do escopo

Avaliações e relacionados no detalhe; banners dinâmicos; newsletter e contato funcionais (continuam demos); wishlist no servidor; frete; comparar produtos; multi-moeda e multi-idioma; login, conta e "meus pedidos"; cancelamento e status além de `PAID`.

## Stack

Mantida; já está de acordo com a skill `scaffold`.

| Item | Valor |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Dados | TanStack Query 5, Axios 1 |
| Estado de cliente | Zustand 5 |
| Estilo | Tailwind 4 (mínimo) + CSS Modules por componente + tokens em `styles/tokens` |
| Ícones | `react-icons/fa` (Font Awesome 5, igual ao template; não misturar outra biblioteca) |
| Testes | Vitest 4, Testing Library, jsdom |
| Acréscimos desta spec | MSW (mock da API nos testes) e Playwright (E2E) |
| Lint/format | ESLint 9 (flat config) e Prettier 3 |

Os valores acima são os ranges do `package.json`; `node_modules` não está instalado, então as versões resolvidas não foram conferidas.

## Decisões e premissas

- Detalhe do produto: página enxuta, sem avaliações.
- `/products` na entrega 2, com filtros no servidor.
- Rating mantido como campo opcional do modelo e do card; a API deve fornecê-lo depois (ver [03](03-dados-e-contrato-com-a-api.md)).
- UI em inglês, preço em BRL (`app/core/utils/currency.ts`).
- Sem login. Token do carrinho e último número de pedido em `localStorage`.
- O mock sai do app (decisão do macroplano); os testes usam MSW.
- Não subir `npm run dev` por iniciativa própria; o usuário roda a própria instância (regra do `CLAUDE.md` do app).

## Dependência do back

O front só funciona contra o back da entrega 1 em diante. Os endpoints, formatos e erros vêm de [`docs/specs/backend/04-contrato-da-api.md`](../backend/04-contrato-da-api.md). Onde o contrato é proposta ou está indefinido, a spec 03 registra como pedido ao back.
