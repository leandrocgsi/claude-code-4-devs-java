# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev             # dev server on http://localhost:3000 (Turbopack)
npm run build            # production build
npm start                # run the production build
npm run lint             # ESLint (flat config, eslint-config-next)
npm run lint:fix
npm run format            # Prettier
npm test                  # vitest (watch mode)
npx vitest run            # vitest, single run
npx vitest run path/to/File.test.tsx   # a single test file
npx vitest run -t "test name substring" # a single test by name
npm run test:coverage     # vitest run --coverage (v8)
npx tsc --noEmit          # type-check only (no build script for this alone)
```

After any code change, the expected validation sequence is `npx tsc --noEmit` → `npm run lint` → `npm run build` → `npx vitest run`. There is no CI wired up for this project — this is the manual gate.

Never start `npm run dev` (or any long-running server) on your own initiative — ask first. The user typically runs their own `npm run dev` instance while reviewing changes, so Fast Refresh picks up edits without needing a restart.

## Architecture

This is the Next.js (App Router) storefront frontend for "Geek Shopping", consuming a separate Spring Boot backend. It lives inside a larger course-materials repo; its two siblings matter for context:
- `../geek-shopping-api` — the Spring Boot backend (`/api/product/v1`, CORS already allows `http://localhost:3000`).
- `../MultiShop` — a licensed (CC BY 4.0) third-party HTML/CSS/JS template ("MultiShop" by HTML Codex) that this app's entire visual design was ported from. **Any visual/layout change must be checked against these actual files, not against memory of prior work** — see "Visual fidelity" below.

### Stack

Next.js App Router + TypeScript (strict) + Tailwind v4 (present but design tokens/CSS Modules do the real styling work) + TanStack Query (server/mock data) + Zustand (client state) + Axios (`app/core/api/httpClient.ts`, one file per REST resource) + `react-icons/fa` (Font Awesome 5 — matches the reference template's own icon family; don't mix in a second icon library) + Vitest/Testing Library.

### Folder structure and the dependency direction

```
app/(dashboard)/<route>/page.tsx  — thin, only renders a components/feature/<Name>
app/(dashboard)/layout.tsx        — Header + Footer + BackToTop shell around every route
app/core/{api,models,mocks,utils}
app/store/modules/<scope>/useXStore.ts   — Zustand, one file per store
components/ui/{atoms,molecules}   — generic, reusable, on-brand primitives
components/feature/<Name>/        — one screen or shell piece: <Name>.tsx + .module.css + index.ts
hooks/use<Thing>/use<Thing>.ts    — TanStack Query wrapper, or a Zustand store facade
styles/tokens/*.css               — design tokens, one file per category, imported via tokens/index.css
```
Dependency direction is one-way: `page.tsx` → `(dashboard)/layout.tsx` → `feature/Header`/`feature/Footer`; a page's feature component → `ui/atoms`/`ui/molecules` + `hooks/*`; hooks → `core/api`/`core/models`/`core/mocks` + `store/modules/*`. Stores are never read directly by components — always through a selector-based facade hook (e.g. `hooks/useCart`, `hooks/useWishlist`) so a component only re-renders on the slice it actually reads.

Routes live under the `(dashboard)` route group, which adds no URL segment — `app/(dashboard)/page.tsx` **is** `/`. Next.js reserves `page.tsx`/`layout.tsx` as route files anywhere under `app/`, including inside `core/`; a non-route file must never be named `page.ts(x)` there (it previously broke the build — see `app/core/models/pagination.ts`, deliberately not `page.ts`).

### Mock-data mode (temporary, single flag)

```ts
// app/core/api/products.ts
export const USE_MOCK_PRODUCT_DATA = true;
```
While `true`, `productsService.list()` serves `app/core/mocks/products.ts` in-memory instead of calling the live API, because the backend's `imageUrl` values are currently broken. Every downstream hook/component is unaware of this — it just consumes `PageResponse<Product>` either way. Flip the flag (and delete the mock branch) once the backend is fixed. `app/core/mocks/categories.ts` derives the Home page's category grid from that same mock catalog with real counts — do not swap the grid's React `key` back to `category.name`; names repeat by design (see file) and only `category.id` is unique.

### Design tokens and the page-canvas convention

`styles/tokens/_colors.css` distinguishes two "light" tokens that are easy to swap by mistake: `--background` (`#fff`, card/box surfaces — product/category items, breadcrumb, tables, form boxes) vs `--surface` (`#f5f5f5`, the page canvas itself — `body`'s background, the header topbar, and the mask behind every dashed section-title). Getting these backwards (gray cards floating on a white page, instead of white cards on a gray page) is the most common fidelity bug in this codebase. `--radius-4/8/12` are all `0` — sharp corners are a deliberate brand trait; only fully circular elements use `--radius-full`.

Any dashed-line-through-text heading (seen throughout Home, Shop sidebar, Cart, Checkout, Contact) must use `components/ui/atoms/SectionTitle` — never a hand-rolled `border-bottom`, which is visually wrong and has been a recurring mistake.

### Visual fidelity to the reference template

This app's look was ported screen-by-screen from `../MultiShop`, deliberately literally — same images, same layout sections, same hover/animation mechanics, even where content doesn't obviously fit a "Geek Shopping" theme. The **only** intentional departures from that reference are: brand name/logo/colors, BRL currency, Brazilian-format address/phone/CEP, `@erudiotraining` social links, and a few cases where the reference's own content is unusable placeholder text (literal `$123.00` on every product, "Category Name" repeated 12 times, hardcoded fake filter counts, a paid-version upsell on the contact page) or a non-functional decorative control (the toolbar's sort/page-size dropdowns are real here since the reference's own options don't correspond to any actual capability). Before changing anything visual, re-read the actual reference file under `../MultiShop` (`index.html`/`shop.html`/`cart.html`/`checkout.html`/`contact.html`/`css/style.min.css`/`js/main.js`) rather than relying on memory — and read `.claude/skills/geek-shopping-app-visual-identity/SKILL.md` first, which is the maintained source of truth for the token table, component inventory, the full list of deliberate departures, and past fidelity mistakes to not repeat. **Keep that skill file updated whenever the layout/visual identity changes.**

### Further reading

- `ARCHITECTURE.md` — full internal architecture (diagrams, state management table, data flow sequence).
- `README.md` — quickstart, page list, what's real vs. mock/demo.
- `.claude/skills/geek-shopping-app-visual-identity/SKILL.md` — brand tokens, component inventory, fidelity guardrail checklist.
