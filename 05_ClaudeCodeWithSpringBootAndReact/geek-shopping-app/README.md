# Geek Shopping App

Storefront frontend for Geek Shopping, built with Next.js (App Router) + TypeScript.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + CSS Modules per component
- TanStack Query (server state) + Zustand (client/UI state: wishlist, cart, header search)
- Axios with a central instance (`app/core/api/httpClient.ts`)
- `react-icons/fa` for icons
- Vitest + Testing Library

## Requirements

- Node.js 20+
- npm

## Getting started

```bash
npm install
cp .env.example .env.local   # already provided as .env.local with local defaults
npm run dev
```

The app runs at `http://localhost:3000`.

## ⚠️ Currently running on mock data

The catalog is temporarily served from `app/core/mocks/products.ts` instead of the live `geek-shopping-api`, because the backend's product images are currently broken. This is controlled by a single flag:

```ts
// app/core/api/products.ts
export const USE_MOCK_PRODUCT_DATA = true;
```

Set it to `false` (and remove the mock branch in `productsService.list`) once the backend's `imageUrl` values are fixed, to go back to live data. See `.claude/skills/geek-shopping-app-visual-identity/SKILL.md` for the full list of what's mocked and why.

## Backend integration (once mocks are turned off)

This app is built to consume `geek-shopping-api` (Spring Boot), expected at `http://localhost:8080` in development (`NEXT_PUBLIC_API_URL` in `.env.local`). The backend already allows CORS from `http://localhost:3000` (see its `WebConfig`), so no extra backend configuration is needed for local development.

Products endpoint used: `GET /api/product/v1?page&size&direction`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Runs the production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Vitest |
| `npm run test:coverage` | Vitest with coverage |

## Pages

| Route | Page | Notes |
| --- | --- | --- |
| `/` | Home | Hero carousel, offer banners, features, categories grid, featured/recent products, vendor strip. |
| `/products` | Shop | Sidebar filters (price/color/size), search, sort, page size, grid/list view, pagination, wishlist, quick view. |
| `/cart` | Shopping Cart | Real quantity stepper, remove item, coupon field (no real coupons yet), order summary. Pre-seeded with a few items so it isn't empty on first load. |
| `/checkout` | Checkout | Billing form (not submitted anywhere real), order summary from the cart, payment method choice, "Place Order" clears the cart and shows a demo confirmation. |
| `/contact` | Contact | Contact form (not submitted anywhere real — shows a demo confirmation), map embed, contact info block. |

## Folder structure

```
app/
  (dashboard)/layout.tsx          — Header + Footer shell
  (dashboard)/page.tsx            — Home
  (dashboard)/products/page.tsx   — Shop
  (dashboard)/cart/page.tsx       — Shopping Cart
  (dashboard)/checkout/page.tsx   — Checkout
  (dashboard)/contact/page.tsx    — Contact
  core/api/                       — axios instance + one file per REST resource
  core/models/                    — shared TS types
  core/mocks/                     — temporary mock catalog + categories (see above)
  core/utils/                     — small shared helpers (e.g. currency formatting)
  store/modules/global/           — Zustand: wishlist
  store/modules/cart/             — Zustand: cart quantities
  store/modules/products/         — Zustand: header search term
components/
  ui/atoms/                       — Button, Input, Select
  ui/molecules/                   — Modal, DataTable, Carousel
  feature/Header/, feature/Footer/ — global shell
  feature/Home/                   — Home screen
  feature/Products/               — Shop screen (grid/list, ShopSidebar, ProductCard, ProductDetails)
  feature/Cart/, feature/Checkout/, feature/Contact/ — the other 3 pages
hooks/
  useProducts/, useCart/, useWishlist/, useProductFilters/
styles/
  _reset.css, tokens/*.css        — brand tokens
```

## Visual identity

Real brand tokens (colors, typography, spacing, radius, shadow) ported from a reference storefront template — see `styles/tokens/*.css` and `.claude/skills/geek-shopping-app-visual-identity/SKILL.md` for the full token table, component inventory, and the current list of mocked content.

## What's real vs. what's a mock/demo

- **Real interactivity**: search, sort, pagination, sidebar filters, grid/list view, wishlist, and cart (add/remove/change quantity) all work against real client state — they just currently read from the mock catalog instead of the live API (see the mock-data notice above).
- **Demo-only, not wired to a backend**: the coupon field (always says coupons aren't available), the checkout form and "Place Order" (clears the cart and shows a confirmation, nothing is actually submitted), and the contact form (shows a confirmation, nothing is actually sent).
- **Visible but intentionally disabled**: the "compare" action on each product card — no comparison feature exists yet.

See `ARCHITECTURE.md` for the full internal documentation.
