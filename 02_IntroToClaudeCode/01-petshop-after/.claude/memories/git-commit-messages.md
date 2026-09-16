---
name: petshop-git-commit-guide
description: Git commit message patterns for PetFeliz project
metadata:
  type: reference
---

# PetFeliz - Git Commit Message Guide

Quick patterns for creating professional commit messages for this project.

## Common Patterns

### Adding Features/Files
```bash
git commit -m "Add [feature/file] - description"
```
Examples:
- `git commit -m "Add dark mode support with theme toggle"`
- `git commit -m "Add CLAUDE.md with architecture guide"`
- `git commit -m "Add WhatsApp floating button to footer"`

### Fixing Issues
```bash
git commit -m "Fix [issue] - description"
```
Examples:
- `git commit -m "Fix smooth scroll on navigation links"`
- `git commit -m "Fix theme persistence on page reload"`
- `git commit -m "Fix mobile menu responsiveness at 480px"`

### Updating Content/Styling
```bash
git commit -m "Update [section] - description"
```
Examples:
- `git commit -m "Update services section content and styling"`
- `git commit -m "Update color scheme for better accessibility"`
- `git commit -m "Update CSS custom properties for dark mode"`

### Refactoring Code
```bash
git commit -m "Refactor [component] - reason"
```
Examples:
- `git commit -m "Refactor Intersection Observer implementation for better performance"`
- `git commit -m "Refactor CSS variables for consistency"`

### Removing Code
```bash
git commit -m "Remove [deprecated item] - reason"
```
Examples:
- `git commit -m "Remove unused animation styles from footer"`
- `git commit -m "Remove old theme toggle implementation"`

## Best Practices

✅ **DO:**
- Start with a verb (Add, Fix, Update, Refactor, Remove)
- Use imperative mood: "Add feature" not "Added feature"
- Keep under 72 characters when possible
- Include project context if needed: `(PetFeliz)`
- Reference issues if available: `Fix #123: description`

❌ **DON'T:**
- Use vague messages: "Update stuff", "Fix things"
- Use past tense: "Added", "Fixed", "Updated"
- Make messages too long for readability
- Use special characters or emojis (keep it professional)

## Example Workflow

```bash
# After making changes to HTML/CSS/JS
git add .
git commit -m "Add smooth scroll animations for hero section"

# After fixing a bug
git add .
git commit -m "Fix localStorage theme persistence on Safari"

# After refactoring
git add .
git commit -m "Refactor CSS Grid to use auto-fit for responsive design"
```

## For Future Claude Sessions

When you need a commit message, just ask:
```
Generate a git commit message for: [describe what I did]
Style: Professional, concise, imperative mood
Language: English
Format: git commit -m 'MESSAGE'
```
