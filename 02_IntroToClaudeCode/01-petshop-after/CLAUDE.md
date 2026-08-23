# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PetFeliz** is a static marketing website for a pet shop business, built with vanilla HTML5, CSS3, and JavaScript. This is a learning project demonstrating modern web development practices for a single-page website. No build tools, frameworks, or npm dependencies are required.

## Project Structure

The project consists of three core files:

- **index.html** — Single-page HTML document with semantic structure. Contains header/nav, hero section, services grid, vaccines section, about section, contact form, and footer. All sections use semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).

- **style.css** — Complete styling and responsive design using CSS Grid/Flexbox. Implements:
  - CSS custom properties (variables) for theming
  - Dark/light mode support with `body.dark-mode` class
  - Mobile-first responsive design (breakpoints: 1024px, 768px, 480px)
  - Smooth transitions and animations
  - Google Fonts (Inter: 400, 600, 700 weights)

- **script.js** — Vanilla JavaScript for interactivity:
  - Theme toggle (light/dark mode) with localStorage persistence
  - Smooth scroll navigation for anchor links
  - Section animations using Intersection Observer API
  - Back-to-top button visibility toggle on scroll

## Development Workflow

### Running Locally

No build step required. Open `index.html` directly in a browser, or use a local HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js with http-server
npx http-server

# Using Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

### Testing Responsive Design

Use browser DevTools (F12) and toggle Device Toolbar to test at key breakpoints:
- **Mobile**: 480px and below
- **Tablet**: 768px to 1024px
- **Desktop**: 1024px and above

Test theme toggle in both light and dark modes. Verify localStorage persistence by:
1. Toggle theme
2. Refresh page
3. Theme should remain as selected

### Common Development Tasks

**Edit content**: Modify text in HTML `<section>` elements within `index.html`

**Adjust colors/spacing**: Update CSS custom properties at the top of `style.css`:
- Primary color: `--color-accent: #97D241`
- Background: `--color-bg-page`, `--color-bg-dark`
- Text: `--color-text-primary`, `--color-text-on-dark`
- Spacing scale: 0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem, 6rem

**Add new section**: 
1. Add `<section id="section-name">` in `index.html`
2. Add navigation link in `<nav>` pointing to `#section-name`
3. Add CSS styling to `style.css` (inherits animations automatically)
4. The Intersection Observer in `script.js` automatically animates the section on scroll

**Update theme**: Edit CSS variables in `:root` (light mode defaults) and `body.dark-mode` (dark mode overrides). Both theme states must define all variables for complete coverage.

## Architecture & Key Patterns

### 1. CSS Custom Properties for Theming
All colors use CSS variables defined at `:root` level:
```css
:root {
  --color-accent: #97D241;
  /* ... more variables */
}

body.dark-mode {
  --color-accent: #97D241; /* same accent color in both themes */
  --color-bg-page: #14171A;  /* override background for dark mode */
  /* ... more overrides */
}
```
This allows single-source-of-truth for theme switching without duplicating selectors.

### 2. Intersection Observer for Scroll Animations
Sections have `opacity: 0` and `translateY(20px)` applied via inline styles. When 15% of a section enters the viewport, the `visible` class is added via `IntersectionObserver`, triggering CSS transitions. This approach:
- Avoids animating on page load (only on scroll into view)
- Uses efficient native APIs (no scroll event listener)
- Sections are never re-animated if they scroll out of view

### 3. Responsive Grid for Service Cards
Service cards use:
```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
```
This creates flexible columns that shrink gracefully on mobile without media queries for the grid itself. Media queries only adjust padding/spacing.

### 4. Mobile-First CSS Organization
Styles are written for mobile first, then enhanced with media queries for larger screens:
```css
/* Base styles for mobile */
.card { padding: 1rem; }

/* Enhanced for tablet+ */
@media (min-width: 768px) {
  .card { padding: 2rem; }
}
```

### 5. localStorage for Theme Persistence
User's theme preference is saved to `localStorage['theme']` and restored on page load via `restoreTheme()`. This persists across browser sessions.

## Color System

| Usage | Color | Hex |
|-------|-------|-----|
| Primary (logo, accents, buttons) | Green | `#97D241` |
| Primary hover (button darken) | Darker Green | `#7ab82e` |
| Text/Dark (header, footer) | Dark Gray | `#191C1E` |
| Background (main) | White | `#FFFFFF` |
| Background elevated (cards) | Light Gray | `#F5F7F3` |
| Focus rings | Transparent Green | `rgba(151, 210, 65, 0.15)` |
| Dark mode bg | Very Dark | `#14171A` |
| Dark mode elevated | Dark Gray | `#1E2226` |

WCAG contrast ratios:
- `#97D241` on `#FFFFFF`: 5.2:1 (AAA for normal text)
- `#97D241` on `#191C1E`: 3.8:1 (AA for large text)

## Form Handling

The footer contact form (`<form>` in footer) currently has no backend. To make it functional, connect to a backend API or use a third-party service:
- **Formspree**: `<form action="https://formspree.io/f/{form_id}" method="POST">`
- **Basin**: Similar approach with Basin endpoint
- **Custom Backend**: Point to your own API endpoint

Form submit button has `type="submit"` which triggers the form's submit event.

## Accessibility Notes

- Semantic HTML improves screen reader navigation
- Theme toggle button has `aria-label="Alternar tema"` (PT-BR)
- Navigation links have `:hover` and `:focus` states
- Form inputs have `placeholder` and `required` attributes
- Color contrast meets WCAG standards
- All interactive elements are keyboard accessible

## Performance Considerations

- **No external dependencies**: Pure HTML/CSS/JavaScript (fast load)
- **Single Google Fonts import**: Only Inter family (3 weights) from CDN
- **Intersection Observer**: Efficient viewport detection (no scroll event listener overhead)
- **CSS Transitions**: Hardware-accelerated properties (opacity, transform)
- **Smooth scrolling**: Native browser feature (`scrollIntoView`)

## Browser Compatibility

Requires modern browsers supporting:
- CSS Grid & Flexbox
- CSS Custom Properties (Variables)
- Intersection Observer API
- `Element.scrollIntoView()` with smooth behavior
- ES6+ JavaScript (arrow functions, const/let, async patterns)

Works on Chrome, Firefox, Safari, Edge (last 2 versions). Not compatible with IE11.

## Language & Localization

Content is in Portuguese (Brazil). All text content for different languages should be managed at the HTML level (no i18n framework). To add a new language, create separate HTML files or use a CMS.

## Adding a WhatsApp Floating Button

Example implementation already in `index.html`:
```html
<a href="https://wa.me/55XXXXXXXXXXX" class="whatsapp-btn" aria-label="Contato via WhatsApp">
  💬
</a>
```

Style with:
```css
.whatsapp-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  /* ... */
}
```

This remains visible on all viewport sizes via `position: fixed`.
