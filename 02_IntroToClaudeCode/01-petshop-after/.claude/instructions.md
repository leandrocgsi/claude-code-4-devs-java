# Claude Code Instructions for PetFeliz

Additional guidelines for Claude Code when working on this project.

## Development

- Always test responsive design at breakpoints: 480px, 768px, 1024px
- Use browser DevTools (F12) to test and validate changes
- Start local server with: `python -m http.server 8000`
- Theme toggle must persist across page reloads (test via localStorage)

## Code Style

- Use semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Use CSS custom properties for all colors and spacing
- Prefer CSS Grid/Flexbox over positioning
- Keep JavaScript vanilla (no frameworks) unless explicitly requested
- Add comments for complex logic (Intersection Observer, theme system)

## Commits

- Follow patterns in `.claude/memories/git-commit-messages.md`
- Keep messages under 72 characters
- Use imperative mood: "Add feature" not "Added feature"
- Reference this project: e.g., "(PetFeliz)"

## Testing

- Visual testing: Check layout at 480px, 768px, 1024px widths
- Theme testing: Toggle light/dark mode and refresh page
- Accessibility: Verify color contrast ratios in CLAUDE.md
- Browser testing: Chrome, Firefox, Safari, Edge (last 2 versions)

## Documentation

- Update CLAUDE.md if architecture or patterns change
- Update `.claude/memories/` if adding new project-specific knowledge
- Keep comments in code for non-obvious logic
- Add inline comments for CSS variable usage

## When Adding Features

1. Update HTML in `index.html` with semantic structure
2. Add styles to `style.css` using CSS variables
3. Add JavaScript to `script.js` if interactivity needed
4. Test at all breakpoints
5. Verify theme toggle works in both light/dark modes
6. Create appropriate git commit following patterns

## Performance Checklist

- Keep Google Fonts import (Inter only, 3 weights)
- Use CSS transitions for smooth animations
- Use Intersection Observer for scroll events (no scroll listeners)
- Test on slow 3G connection (Chrome DevTools)
- Keep bundle small (vanilla JS only)

## Accessibility Checklist

- Verify color contrast meets WCAG standards
- Use semantic HTML for screen readers
- Add aria-label to non-text buttons
- Test keyboard navigation (Tab key)
- Ensure focus states are visible

## Questions?

Refer to:
- **Architecture & workflow**: `../CLAUDE.md`
- **Commit patterns**: `.claude/memories/git-commit-messages.md`
- **Project config**: `.claude/settings.json`
- **Project structure**: `.claude/README.md` (this file)
