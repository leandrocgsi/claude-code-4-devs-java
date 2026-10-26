# 04 — UI, estado e design system

Fonte: skills `scaffold`, `scaffold-advanced`, `visual-identity`, o `CLAUDE.md` do app e o guardrail `geek-shopping-app/.claude/skills/geek-shopping-app-visual-identity/SKILL.md`.

## Estado: o que vai onde

Regra: **dado do servidor no TanStack Query; estado só de UI ou do cliente no Zustand**. Hoje o carrinho está no Zustand (`useCartStore.ts:11` o pré-semeia com `{1:1, 6:2, 9:1}`); passa para o servidor.

| Estado | Onde | Observação |
|---|---|---|
| Produtos, facets, categorias, cores, tamanhos | Query | chaves em [03](03-dados-e-contrato-com-a-api.md) |
| Carrinho (itens, subtotal) | Query (`['cart']`) | fonte da verdade é o back |
| Pedido (`['order', number]`) | Query | inclui cupom, desconto, total e pagamento |
| **Token do carrinho** | Zustand com `persist` (`localStorage`) | UUID gerado no primeiro uso |
| **Último `orderNumber`** | Zustand com `persist` | permite reabrir o pedido sem login |
| Filtros e ordenação do shop | **URL** (query params) | substitui `useState` local e o store de busca |
| Busca do header | URL (`q`) | hoje `useProductFiltersStore` |
| Wishlist | Zustand com `persist`, guardando `number[]` | hoje `Set<number>` (`useWishlistStore.ts:10`), que não serializa |
| Toasts, modal de quick view, modo grid/lista | Zustand ou `useState` local | só UI |
| Campos do formulário de checkout | `useState`/estado do formulário | controlados |

Componentes só leem stores por **hook facade com seletores** (`useCart`, `useWishlist`, `useCartToken`, `useLastOrder`, `useToast`). Stores: uma por arquivo em `app/store/modules/<scope>/`. Com `persist`, usar `partialize`/`version` e tratar `localStorage` indisponível sem quebrar a renderização.

O token do carrinho é lido pelo interceptor do `httpClient` e nunca aparece em URL ou em log.

## Hooks de dados (fachadas sobre Query)

`useProducts(params)`, `useProduct(id)`, `useFacets(params)`, `useCategories()`, `useCart()` (+ mutações `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem`, `useClearCart`), `useOrder(number)`, `useCreateOrder()`, `useApplyCoupon()`, `useRemoveCoupon()`, `usePayOrder()`. Cada mutação invalida as chaves definidas em [03](03-dados-e-contrato-com-a-api.md). Erros de `useQuery` usam `isError`/`error` (o `onError` não existe em `useQuery` no TanStack Query 5); toasts de erro de mutação ficam no `onError` da mutação ou no componente.

## Design system

Já existem: **atoms** `Button`, `Input`, `Select`, `SectionTitle`; **molecules** `Modal`, `DataTable`, `Carousel`.

Necessários pelas telas (construir só quando uma tela usar, sem especular):

| Componente | Camada | Uso |
|---|---|---|
| `Pagination` | molecule | shop; apresentação pura (`page`, `totalPages`, `onPageChange`), retorna nulo com 1 página |
| `Toast` (+ store) | molecule | feedback de adicionar ao carrinho, erros de mutação |
| `Spinner` | atom | loading de listas e botões |
| `EmptyState` | atom | carrinho vazio, busca sem resultado |
| `InlineAlert` | molecule | erros de regra (cupom inválido, estoque, 409) |
| `Checkbox`, `RadioGroup` | atoms | filtros da sidebar, "ship to different address", método de pagamento |
| `QuantityStepper` | molecule | carrinho e detalhe do produto (hoje inline em `Cart`) |
| `PriceTag` | atom | preço atual e `oldPrice` riscado, reutilizado por card, detalhe e carrinho |
| `RatingStars` | atom | estrelas do card; recebe `rating?` e `reviewCount?` e não renderiza nada se `rating` for nulo |

`ProductCard` e `ShopSidebar` continuam como componentes de **feature**, não de `ui/`. Skills: mexer em `components/ui/*` exige coordenação; telas em paralelo não editam o design system.

## Tokens e visual

- Tokens em `styles/tokens/*.css`, um arquivo por categoria, via `index.css`. Cores só de tokens; **`--background` (cartões) ≠ `--surface` (canvas da página)**; raios `0` por decisão de marca; título tracejado só com `SectionTitle`.
- Ícones só de `react-icons/fa`, com tamanhos padronizados; não misturar outra biblioteca.
- Mudança visual: reler o arquivo correspondente em `../MultiShop` (`index.html`, `shop.html`, `cart.html`, `checkout.html`, `contact.html`, `css/style.min.css`, `js/main.js`) e o guardrail antes de alterar, e manter o guardrail atualizado.
- Novas telas sem equivalente no template (`/products/[id]`, `/orders/[number]`) **não existem no MultiShop**: compor com os componentes e tokens existentes (cartões brancos sobre canvas cinza, `SectionTitle`, botões do design system), sem inventar valores de design, e registrar a composição no guardrail.

## Estados de tela

Toda tela que lê dados define explicitamente: **loading** (skeleton ou `Spinner`), **vazio** (`EmptyState`), **erro** (mensagem e "tentar novamente") e **sucesso**. Formulários mostram erro por campo a partir de `ApiError.fields`.

## Acessibilidade

`aria-label` em botões só de ícone; `role="dialog"`/`aria-modal` no `Modal`; foco gerenciado ao abrir/fechar modais; rótulos associados aos campos (`htmlFor`/`id`); contraste dos tokens existentes. Paginação com `aria-label` em anterior/próximo.
