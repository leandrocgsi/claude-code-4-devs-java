# 06 — Qualidade e testes

Fonte: skills `scaffold` e `scaffold-advanced` (Vitest + Testing Library, testes em `__test__/`), `CLAUDE.md` do app (gate manual) e o contrato do back. Decisão do projeto: **Vitest + Testing Library + MSW** e **E2E com Playwright**.

## Pirâmide

| Camada | Ferramenta | O que cobre |
|---|---|---|
| Unitário | Vitest | utilitários (`currency`), adaptador HAL, mapeamento de erro (`ApiError`), reducers/seletores de store |
| Componente e hook | Vitest + Testing Library + MSW | componentes de UI e de feature, hooks de dados e mutações, com a API simulada |
| E2E | Playwright | fluxo completo contra o back real e MySQL |

Hoje existe um único teste: `components/ui/atoms/Button/__test__/Button.test.tsx`. Não há MSW, E2E nem CI.

## Vitest, Testing Library e MSW

- Testes ficam em `__test__/` ao lado do código (`<Name>.test.tsx`), como a skill pede.
- **MSW** responde às chamadas do `httpClient` com o **contrato real**:
  - listagens em HAL (`_embedded.products`, `page`, `_links`), inclusive primeira e última página (sem `prev`/`next`) e página vazia;
  - erros `ExceptionResponse` e `ProblemDetail` com `errors{}`;
  - `409` e `404`;
  - verificação do header `X-Cart-Token` nas rotas de carrinho e de pedido.
- Handlers compartilhados em um arquivo único (por exemplo, `test/msw/handlers.ts`) e `server` configurado no `vitest.setup.ts`. Os dados de teste vivem na pasta de testes, não em `app/core/`.
- Wrapper de teste com `QueryClientProvider` (sem retry, `gcTime` baixo) para hooks e telas.
- O que testar por módulo:

| Módulo | Casos principais |
|---|---|
| Shop | filtros e ordenação viram query params; mudar filtro volta a `page=0`; "Best Rating" → `sortBy=rating`; página vazia; erro 400 |
| Card | `RatingStars` omitido sem `rating`; `oldPrice` riscado; botão desabilitado sem estoque |
| Detalhe | cor/tamanho obrigatórios; quantidade limitada ao estoque; 404 |
| Carrinho | cria token no primeiro uso; soma de quantidades; contador do header; carrinho vazio/expirado |
| Checkout | validação por campo (`errors{}`); entrega opcional; carrinho vazio redireciona |
| Pedido | "Place Order" guarda o `number` e navega; 409/400 de estoque |
| Cupom | aplicar/remover; mensagens de cupom inválido; desabilitado após pagar |
| Pagamento | método enviado no enum; total vindo do servidor; estado `PAID` |

- Stores com `persist`: testar hidratação e `localStorage` indisponível.
- A cobertura exclui hoje `app/core/api/**`, `app/store/**` e barrels (`vitest.config.ts:16-26`). Com MSW, **a camada `core/api` e as stores passam a ser testadas**, então remover essas duas exclusões da configuração. O `ARCHITECTURE.md:184` ainda cita `app/core/mocks` como excluído; atualizar quando o mock sair.

## E2E com Playwright

- **Fluxo principal:** Home → shop (filtrar e ordenar) → detalhe → adicionar ao carrinho → carrinho → checkout → pedido → aplicar cupom → pagar → pedido `PAID`.
- **Fluxos de erro:** produto sem estoque; cupom inválido; pagar duas vezes.
- **Pré-requisitos:** back (`geek-shopping-api`) e MySQL no ar, com as migrations de seed aplicadas e dados determinísticos (inclusive um cupom de teste e um produto sem estoque). O front em `http://localhost:3000`, com `NEXT_PUBLIC_API_URL` apontando para o back.
- **Dados:** não depender de aleatoriedade do seed; criar o que o teste precisa (por exemplo, produto e cupom via API administrativa) ou usar registros fixos do seed.
- **Isolamento:** cada teste usa um token de carrinho novo (`localStorage` limpo por contexto do Playwright).
- Executar com `npx playwright test`. Nunca subir `npm run dev` ou o back por iniciativa própria; o ambiente é preparado pelo usuário (regra do `CLAUDE.md` do app).
- Estrutura sugerida: `e2e/` na raiz do app, `playwright.config.ts`, e fora da cobertura do Vitest (o `include` do Vitest já restringe a `**/*.test.{ts,tsx}`; os specs do Playwright usam `*.spec.ts`).

## Gates

Manual, como hoje: `npx tsc --noEmit` → `npm run lint` → `npm run build` → `npx vitest run`. Acrescentam-se `npm audit` ao instalar dependências (MSW, Playwright) e `npx playwright test` para o E2E. Ainda não há CI; a spec registra isso como lacuna aceita por ora.

## Critério de pronto por entrega

1. `tsc`, lint, build e Vitest passam.
2. Os casos de componente/hook do módulo passam contra o MSW com o contrato real.
3. O fluxo E2E do módulo passa contra o back real (executado pelo usuário).
4. Estados de loading, vazio e erro existem e foram vistos no navegador, comparando com o MultiShop quando a tela existe no template.
5. `README.md`, `ARCHITECTURE.md` e o guardrail visual atualizados.
6. Nenhum mock de produção restante em `app/core`.
