# 02 — Arquitetura e convenções

Fonte: skills `erudio-frontend:scaffold`, `scaffold-advanced` e `visual-identity`, mais o `CLAUDE.md` e o `ARCHITECTURE.md` do app. A estrutura atual já segue a skill; esta spec fixa o alvo e os acréscimos.

## Estrutura de pastas (alvo)

```
app/
  (dashboard)/
    layout.tsx                 Header + Footer + BackToTop
    page.tsx                   /
    products/page.tsx          /products
    products/[id]/page.tsx     /products/[id]          (novo)
    cart/page.tsx              /cart
    checkout/page.tsx          /checkout
    orders/[number]/page.tsx   /orders/[number]        (novo)
    contact/page.tsx           /contact
  core/
    api/        httpClient.ts + um arquivo por recurso
    models/     tipos do domínio (pagination.ts, não page.ts)
    utils/      currency.ts, adaptadores
  store/modules/<scope>/useXStore.ts
  layout.tsx, providers.tsx, globals.css
components/
  ui/atoms/, ui/molecules/
  feature/<Name>/              <Name>.tsx + <Name>.module.css + index.ts
hooks/use<Thing>/use<Thing>.ts
styles/tokens/                 um arquivo por categoria
```

`app/core/mocks/` **deixa de existir** (ver [07](07-alinhamento-do-app-atual.md)). Mocks de teste vivem na pasta de testes (MSW), não no código de produção.

## Direção de dependência

`page.tsx` → `feature` → `ui` / `hooks` → `core` / `store`. Uma `page.tsx` só importa e renderiza uma feature. Componentes nunca leem store direto: sempre por hook facade com seletores. Hooks de dados envolvem o TanStack Query; services em `core/api` nunca importam React.

## Convenções

- **Nomes em inglês** para arquivos, pastas, componentes, funções, variáveis, tipos, campos e classes CSS. Só o texto exibido segue o idioma da UI (inglês).
- **Componente de feature:** `<Name>.tsx` + `<Name>.module.css` + `index.ts` (barrel `export { default } from './Name'`); subcomponentes em pastas próprias dentro da feature.
- `'use client'` onde há estado, efeito ou handler. Páginas ficam finas.
- Props opcionais com default em vez de hardcode ou duplicação.
- Alias `@/*` → `./*`.
- Nenhum arquivo não-rota chamado `page.ts(x)` dentro de `app/` (quebra o build).
- Rotas dinâmicas usam o parâmetro do contrato: `[id]` para produto e `[number]` para pedido.
- Query params da listagem (`page`, `q`, `categoryId`, `minPrice`, `maxPrice`, `colorId`, `sizeId`, `sortBy`, `direction`) ficam na **URL** da página `/products`, para o estado ser compartilhável e sobreviver a recarregamento.

## Configuração

- **Variáveis:** `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:8080`) e `PORT`. Hoje os scripts fixam `-p 3000` (`package.json:6,8`) e `PORT` não é lida; a skill pede `-p <PORT>`.
- **Acesso à API:** um único caminho. Opção recomendada: chamadas diretas a `NEXT_PUBLIC_API_URL` com CORS no back (`cors.originPatterns` já inclui `:3000`), removendo o rewrite de `next.config.ts:20-27`. Alternativa: manter só o rewrite e usar `baseURL` relativo. As duas não devem conviver (hoje convivem). Decisão no plano micro da entrega 2.
- **Imagens:** o `imageUrl` do back é externo. O `next.config.ts` precisa de `images.remotePatterns` para os hosts usados, ou o app continua com `<img>` simples como hoje no DataTable. As imagens do template em `/assets/multishop/` seguem em `public/`.
- **Headers de segurança** do `next.config.ts` permanecem.
- **Query client** (`app/providers.tsx`): `staleTime 0`, `refetchOnWindowFocus false`, `refetchOnMount true`, `retry 1`. Mutações não fazem retry.

## Gates (manual, sem CI)

`npx tsc --noEmit` → `npm run lint` → `npm run build` → `npx vitest run`. Acrescentam-se: `npm audit` ao instalar dependências novas e `npx playwright test` para o E2E (precisa de back e MySQL no ar). Nunca iniciar servidor de longa duração sem perguntar.

## Documentação viva

Manter atualizados `README.md`, `ARCHITECTURE.md` e o guardrail `geek-shopping-app-visual-identity/SKILL.md` sempre que rotas, estado ou visual mudarem (regra do `CLAUDE.md` do app).
