---
name: geek-shopping-app-visual-identity
description: Guide + guardrail for geek-shopping-app's visual identity (brand tokens, icon convention, component inventory, fidelity checklist). Use before building or reviewing any screen so it matches the established look instead of inventing a new one.
---

# geek-shopping-app — Visual Identity Guide & Guardrail

This skill is the permanent source of truth for `geek-shopping-app`'s visual identity, generated from a one-time port of a reference HTML/CSS storefront template ("MultiShop" by HTML Codex, kept locally at `../MultiShop`, relative to this project's parent folder — read it again if a fidelity question comes up that this file doesn't answer). Load it before building or reviewing any screen. **Update this file every time the layout/visual identity changes** — it drifts out of date otherwise and stops being useful as a guardrail.

The port follows the reference **to the letter**: every product image, category image, offer banner, vendor logo, layout section and hover/animation mechanic from the reference is used as-is, in the same order, even when it doesn't obviously fit a "geek" theme. Only brand name/logo/colors and the specific fields called out below (address, phone, currency) were deliberately changed — see "Deliberate departures from the reference" below for the full, closed list. Anything not on that list must match the reference literally.

## Part A — Guide

### Page canvas convention (read this first — it drives every background-color choice)

The reference's `<body>` background is **gray** (`#f5f5f5`, `bg-secondary` / `--surface`), not white. Individual content boxes ("cards": product items, category items, filter boxes, tables, breadcrumb bar, checkout/contact boxes) are `bg-light` = pure **white** (`--background`) and float on top of that gray canvas — that contrast is what makes them read as cards. The one place gray is used *inside* a card-less area is the section-title text mask (see below), because it needs to blend with the gray page behind it, not stand out.

Concretely: `app/globals.css`'s `body` background is `var(--surface)`. Any wrapper/breadcrumb/table-row/form-box background is `var(--background)` (white). Getting this backwards (gray cards on a white page, or vice versa) is the single most common fidelity bug in this project — always check which one a given box actually is before writing `background-color`.

### Brand tokens (`styles/tokens/*.css`)

| Token | Value | Usage |
| --- | --- | --- |
| `--brand-primary` | `#ffd333` | Primary buttons, active pagination page, wishlist/cart badge, brand wordmark's second block, categories-toggle fill, back-to-top button |
| `--brand-primary-hover` | `#ffc800` | Primary button hover |
| `--on-primary` | `#3d464d` | Text/icon color on top of `--brand-primary` |
| `--brand-dark` | `#3d464d` | Dark navbar, footer, wordmark's first block, `ghost`/`dark` button base, offer overlay tint (`rgba(61,70,77,.5)`) |
| `--brand-dark-hover` | `#23292d` | `dark` button hover |
| `--background` | `#ffffff` | **Card/box backgrounds** (`bg-light` in the reference) — product/category items, breadcrumb, tables, filter/checkout/contact boxes, header's search bar row |
| `--surface` | `#f5f5f5` | **Page canvas** (`body`, `bg-secondary` in the reference) — the `<body>` background, the header's topbar strip, and every section-title text mask |
| `--text-onsurface` | `#212529` | Body text |
| `--text-oninactive` | `#6c757d` | Muted text, category labels |
| `--text-oninverse` | `#ffffff` | Text on dark backgrounds |
| `--outline` | `#dee2e6` | Borders, dashed section-title rule |
| `--error` | `#dc3545` | Out-of-stock badge, cart remove button, error messages |
| `--success` | `#28a745` | Reserved — no current usage |
| `--alert` | `#ffc107` | Reserved — no current usage |
| `--info` | `#17a2b8` | Reserved — no current usage |
| `--radius-4` / `--radius-8` / `--radius-12` | `0` | **Every** button, input, select, card, modal, table — sharp corners is a defining trait of this brand. Never round these. |
| `--radius-full` | `9999px` | Circular elements only (wishlist/cart badge, back-to-top button) |
| `--shadow-hover` | `0 0 30px #dddddd` | Card hover elevation, dropdown menu elevation |
| Font | Google Roboto, weights 400/500/700 | Loaded once in `app/layout.tsx` via `next/font/google`, exposed as the `--font-sans` CSS variable, consumed through `--font-family-base` |
| Currency | `pt-BR` / `BRL` (`app/core/utils/currency.ts`) | **Deliberate departure** — see below |
| Locale content | Address/phone/CEP in Brazilian format (Av. Brasil, 123 - Centro, Uberlândia - MG, 38400-100 / +55 (34) …) | **Deliberate departure** — see below |

### Logo

A wordmark, not a graphic mark — two adjoining color blocks, same technique everywhere it appears (`components/feature/Header/Header.tsx`):
```tsx
<span className={styles.logoDark}>Geek</span>
<span className={styles.logoPrimary}>Shopping</span>
```
`logoDark` = `--brand-dark` background + `--brand-primary` text. `logoPrimary` = `--brand-primary` background + `--on-primary` text. Never swap the two blocks' colors, never add a graphic icon to it (no source logo file exists to base one on — see "Never invent" below).

### Icon convention

`react-icons/fa` (Font Awesome 5 free set) exclusively — it's the icon family the reference design uses (`fa`/`fas`/`far`/`fab` classes), so it's a direct fidelity match, not a Lucide/generic substitution. Add new icons from the same package; don't mix in a second icon library.

### The section-title "dashed line through text" pattern

Every reference heading that uses `<h_ class="section-title ..."><span class="bg-secondary pr-3">Text</span></h_>` (Home's Categories/Featured Products/Recent Products, Contact Us, Shop's sidebar filter headings, Cart Summary, Checkout's Billing Address/Shipping Address/Order Total/Payment) is one single reusable component: **`components/ui/atoms/SectionTitle`**. Never re-implement this by hand (a plain `border-bottom` is the wrong technique and a recurring mistake — see "Known past mistakes" below).

```tsx
<SectionTitle as="h2" size="lg">Categories</SectionTitle>   {/* Home, Contact — text-uppercase, 20px */}
<SectionTitle as="h5" size="sm">Filter by price</SectionTitle> {/* Shop sidebar, Cart, Checkout — 14px */}
```
Mechanism: the heading is `position:relative` with a full-width `::after` dashed rule at `top:50%; z-index:-1`; the visible text sits in a `<span>` with `background-color: var(--surface)` (matching the gray page canvas, not white — see "Page canvas convention" above) and `padding-right` to mask the line where the text sits.

### Component inventory

| Component | File | Visual contract |
| --- | --- | --- |
| `Button` | `components/ui/atoms/Button` | `variant`: `primary` (yellow), `dark` (navy), `secondary` (white/outline), `ghost` (navy outline → yellow on hover, used for `.btn-outline-dark`-style icon actions). `square` prop = 40×40 icon button. |
| `Input` / `Select` | `components/ui/atoms/*` | Sharp corners, `--outline` border, `--background` fill. |
| `SectionTitle` | `components/ui/atoms/SectionTitle` | The dashed-line-through-text heading — see above. Always use this, never a hand-rolled heading style. |
| `Modal` | `components/ui/molecules/Modal` | Sharp corners (no direct reference-design example existed for modals — this radius was extrapolated from the brand's general sharp-corner rule, not read off a literal source element). |
| `DataTable` | `components/ui/molecules/DataTable` | The Shop screen's **list view** — a project addition; the reference only has a grid view. |
| `Carousel` | `components/ui/molecules/Carousel` | Generic slide carousel (autoplay, dots, arrows) — powers the Home hero. |
| `ProductCard` | `components/feature/Products/ProductCard` | The literal product-card pattern: square image, hover zoom (`transform: scale(1.2)`), hover overlay (`hsla(0,0%,100%,.7)`) with 4 action buttons that fade/slide in staggered by 0.05s each, **in this exact order** (matches the reference's DOM order, which the stagger timing is keyed to by position, not identity): 1) cart (disabled + "Out of stock" title when `quantity <= 0`), 2) wishlist toggle, 3) compare — `disabled`, `title="Compare (coming soon)"` (no comparison feature exists), 4) quick view (opens the details `Modal`). Never reorder these buttons without also re-checking the nth-child stagger CSS still tells the intended story. |
| `ShopSidebar` | `components/feature/Products/ShopSidebar` | Price/color/size radio filters, counts computed live from the mock catalog (the reference hardcodes fake counts like `150`/`295` — real computed counts are a deliberate, sensible departure, not a fidelity gap). |
| `Header` / `Footer` / `BackToTop` | `components/feature/Header`, `Footer`, `BackToTop` | Global shell wrapped by `app/(dashboard)/layout.tsx`. |

### Header — 3-tier structure (do not collapse back into one bar)

The reference header is **three stacked, full-width bars**, identical on every page:
1. **Topbar** (`--surface`, gray): left = About/Contact/Help/FAQs (plain, non-navigating text — the reference doesn't link them anywhere either); right = three hover-opened dropdowns (`My Account` → Sign in/Sign up demo buttons; currency, defaulted to `BRL` — see "Deliberate departures" — with EUR/GBP/CAD as decorative alternatives; language, defaulted to `EN`, with FR/AR/RU as decorative alternatives). Hidden below `900px` (see "Known intentional gaps").
2. **Light bar** (`--background`, white): logo + search input + "Customer Service" / phone block (right-aligned, phone uses the Brazilian number — see "Deliberate departures").
3. **Dark navbar** (`--brand-dark`): Categories toggle (yellow, opens the vertical category panel) + main nav links (Home/Shop/Shop Cart/Checkout/Contact) + wishlist/cart icons with badges, right-aligned.

### Home page — offer banners

Both the two side-by-side offers next to the hero carousel and the two larger mid-page offers use the same pattern (`.offer`/`.midOffer` + shared `.offerImage`/`.offerContent`/`.offerBadge`/`.offerTitle`/`.offerLink` classes in `Home.module.css`): a `position:relative;overflow:hidden` box containing an absolutely-positioned `<img>` (zooms + rotates 5° on hover, `transition:.5s`) and an absolutely-positioned dark overlay (`rgba(61,70,77,.5)` = `--brand-dark` at 50%) holding the "Save 20%" badge, "Special Offer" title, and a **"Shop Now" button** (`.offerLink`, styled like `.btn-primary`). The box itself is not a link — only the button inside is. Never collapse this back into a plain `background-image` div with no image element, no button, and no hover zoom (a past mistake — see below).

### Home page — category cards

`.categoryCard` has a white (`--background`) resting background that turns `--brand-primary` (yellow) on hover, and its 100×100 image (wrapped in an `overflow:hidden` `.categoryImageWrap`) zooms + rotates 5° on hover — same mechanic as the offer images and the product-card image. No color override on hover for the name/count text (the reference doesn't add one either, even though it's low-contrast on yellow — that's the literal source behavior).

### Home page — vendor carousel

Real continuous CSS-only auto-scroll: `VENDOR_LOGOS` doubled and animated via `@keyframes vendor-scroll` (`translateX(0)` → `translateX(-50%)`, linear, paused on hover) inside an `overflow:hidden` track. Each logo sits in a `.vendorItem` white (`--background`) box with padding — **no** grayscale/opacity hover filter (that was an invented effect with no basis in the source, removed after a fidelity review — see "Known past mistakes").

### Back-to-top button

`components/feature/BackToTop` — fixed bottom-right, `--brand-primary` circular-ish square button, appears after scrolling past 100px, smooth-scrolls to top on click, with the source's own bouncing `@keyframes` animation (`translateY(0)` ↔ `translateY(-15px)`, 1s infinite alternate). Mounted once in `app/(dashboard)/layout.tsx`, not per-page.

### Checkout page — shipping address toggle

"Ship to different address" is a real checkbox that reveals a second field grid (identical fields to Billing Address) below the billing box, matching the reference's collapsible `#shipping-address` section. "Create an account" is a decorative checkbox (no auth system exists).

### Page layout patterns

- **Section header**: a white (`--background`) breadcrumb bar — plain text, no icons, `--outline`-colored separator. Breadcrumb crumb count/text matches the reference exactly per page: Home has none, Shop is "Home / Shop / Shop List", Cart is "Home / Shop / Shopping Cart", Checkout is "Home / Shop / Checkout", Contact is "Home / Contact" (no "Shop" crumb — the reference doesn't have one there either).
- **Toolbar** (Shop page): left = view-mode icon toggle (`square`, active = `--brand-dark` fill); right = `Select` controls (sort, page size) — the reference's own "Sorting"/"Showing" dropdown options (Latest/Popularity/Best Rating, 10/20/30) are decorative and don't correspond to any real backend capability, so this project uses real, functional sort/page-size controls instead — a deliberate, necessary departure, not an oversight.
- **Pagination**: numbered page buttons (`--brand-primary` fill on the active page) + text `Previous`/`Next`, matching the reference's Bootstrap `.pagination` component — no icon arrows.

## Part B — Guardrail

Run this checklist before calling any screen in this project done:

1. **Colors only from the token table above** — no new hardcoded hex value in a `.module.css` file, except the two literal `rgba()` overlays documented above (`hsla(0,0%,100%,.7)` product-card hover, `rgba(61,70,77,.5)` offer overlay), which are themselves read directly off the reference's CSS. Before writing any `background-color`, check the "Page canvas convention" section — don't guess between `--surface` and `--background`.
2. **Typography only from the defined scale** (`--font-size-*` in `styles/tokens/_typography.css`) and the Roboto font — no inline `font-family` or ad hoc pixel sizes.
3. **Every button, input, card, modal, and table stays sharp-cornered** (`--radius-4/8/12` = `0`). Only fully circular/near-circular elements may use `--radius-full` (wishlist/cart badge, back-to-top button).
4. **Icons only from `react-icons/fa`**, at a size consistent with the surrounding text/button.
5. **Reuse before creating**: check the component inventory above before writing a new `ui/atoms` or `ui/molecules` component — most screens only need a new `components/feature/<Name>` composition, not a new design-system primitive. In particular, always use `SectionTitle` for any dashed-line heading — never hand-roll it again.
6. **Code identifiers stay in English**; only user-facing text follows the product's content language (English) — except the specific Brazilian-format data values called out under "Deliberate departures" below, which are data, not code identifiers.
7. **Port everything literally by default.** Every product/category/offer/vendor image, every layout section, every hover/animation mechanic from `../MultiShop` gets used as-is, even when it doesn't obviously fit a "geek" theme — the user explicitly rejected curating/filtering the reference's content. Only change something if it's on the "Deliberate departures" list below; if a new request implies changing something not on that list, treat it as a scope question, not a default.
8. **When re-auditing fidelity, re-read the actual reference files** (`index.html`/`shop.html`/`cart.html`/`checkout.html`/`contact.html`/`css/style.min.css`/`js/main.js`) rather than relying on memory of this document — this file can itself drift out of date if a change here was forgotten.

### Deliberate departures from the reference (the closed list — nothing else is allowed to differ)

- **Brand name/logo/colors**: "Geek Shopping" wordmark and the yellow/navy palette replace "MultiShop" — the whole reason this template was chosen.
- **Currency**: Brazilian Real (`pt-BR`/`BRL` via `Intl.NumberFormat`, `app/core/utils/currency.ts`) instead of the reference's literal `$123.00`-style placeholder prices. The header topbar's currency dropdown defaults to `BRL` instead of `USD` for the same reason (its EUR/GBP/CAD alternatives are decorative either way, so they're kept as-is).
- **Locale data**: Brazilian-format address (Av. Brasil, 123 - Centro, Uberlândia - MG, 38400-100), phone numbers (+55 (34) …), and CEP postal codes replace the reference's placeholder US-style values (`123 Street, New York, USA`, `+012 345 67890`) in the footer, contact page, and checkout form.
- **Social links**: `@erudiotraining` (the real Erudio Training handles) instead of the reference's dead `href="#"` social icons.
- **Product catalog values**: real, varied product names/prices/descriptions (camera, drone, smartwatch, chair, sweatshirt, lamp, sneakers, blouse, skincare box) replace the reference's literal placeholder text ("Product Name Goes Here", `$123.00` on every single item, `(99)` reviews on every item) — the placeholder text is obvious lorem-ipsum-equivalent filler in the source, not a real design decision to replicate. The 9 product **images** themselves are used exactly as the reference has them, uncurated.
- **Category names/counts** (Home's category grid, Shop sidebar filters): computed for real from the mock catalog, replacing the reference's literal placeholder text ("Category Name" on every card, hardcoded fake counts like `150`/`295`/`1000`) for the same reason as above.
- **Sort/page-size controls** (Shop toolbar): real, functional options instead of the reference's decorative "Latest/Popularity/Best Rating" and "10/20/30" dropdown items, which don't correspond to any real capability.
- **Contact page heading**: the reference's literal copy here is a vendor upsell ("...available in the Pro Version only [link to HTML Codex's paid product]") — third-party commercial advertising, not template layout, so it was not ported; the form goes straight from breadcrumb + section title into the fields instead.
- **Page container width**: this project centers each page's content in a `max-width: 1200px` wrapper, while the reference uses full-bleed `container-fluid` sections edge-to-edge with `px-xl-5` inner padding. This is a known, accepted simplification (see "Known intentional gaps"), not something to silently fix by rewriting every page's layout — flag it if asked to close this gap, don't just do it.

### What to do when a case isn't covered

Never invent a value or pattern that isn't in this file and isn't a literal reference value. First, try to compose the answer from what's already documented above (an existing token, an existing component with a new prop value) or from re-reading the actual reference file for that section. If that's genuinely not possible — stop and ask, rather than guessing a new value into existence.

### Known intentional gaps (do not silently "complete" these)

- **Page container width** stays "boxed" (max-width 1200px, centered) instead of the reference's true full-bleed `container-fluid` layout — see "Deliberate departures" above. Revisiting this would require reworking every page's wrapper into a full-width-section-plus-inner-padding pattern; it hasn't been requested.
- **No favicon was ported** — the reference template's own `favicon.ico` reference is broken (the file doesn't exist in it either). The app still uses Next's default; replace it if/when a real one is designed.
- **The topbar's My Account / Currency / Language dropdowns are decorative** (hover-opened, no real state change) — same as in the reference, where they're static Bootstrap dropdowns wired to nothing.
- **The Newsletter form, contact form, and checkout "Place Order" are demo-only** — they show a local confirmation state and don't call any backend; the reference itself has no real backend for these either (its own contact form nag literally says PHP/Ajax submission is a paid-version-only feature).
- **The footer's "Design inspired by HTML Codex" link is a license requirement, not decoration** — the reference template is licensed CC BY 4.0 and its terms forbid removing the attribution link when the template is ported/used. Do not remove it unless a paid, no-attribution license for the template is obtained.

### Known past mistakes (don't repeat these)

- Implementing a "dashed line through text" section title with a plain `border-bottom` instead of the `::after` pseudo-element + masking `<span>` technique. Always use the `SectionTitle` component now.
- Using `--background` (white) for the section-title mask `<span>` instead of `--surface` (gray) — the mask needs to match the gray page canvas it sits on, not the white card color.
- Mixing up `--surface`/`--background` in general on card boxes (breadcrumb, tables, filter/checkout/contact boxes) — see "Page canvas convention" at the top of this file.
- Adding an invented `filter: grayscale(1); opacity: 0.7` hover effect to the vendor logos — no basis in the source CSS.
- Curating/filtering the reference's product images, categories, or content to better fit a "geek" theme (e.g. swapping out the Nike sneakers or the Curology skincare box) — the user explicitly rejected this; port everything literally.
- Reordering the `ProductCard` hover-action buttons away from the reference's cart → wishlist → compare → quick-view sequence — the stagger animation timing is keyed to DOM position, so reordering the buttons silently changes which icon animates in first.

### Fidelity audit process (if the reference template is revisited)

1. Re-read the relevant file(s) under `../MultiShop` in full — don't rely on memory of this document.
2. Check every literal value (color, spacing, radius, background — especially `bg-light` vs `bg-secondary`) actually used in that part of the reference against what's in this file; update this file if the reference reveals something more precise.
3. Trace the CSS cascade before trusting a selector — a specific-looking rule can be a no-op if a later, more specific rule wins.
4. Check the reference's `js/main.js` too, not just its HTML — some elements/behavior only exist at runtime there (e.g. the back-to-top fade and the owl-carousel vendor scroll settings).
5. Re-run the guardrail checklist above against the result, and update this file's sections if anything changed.
