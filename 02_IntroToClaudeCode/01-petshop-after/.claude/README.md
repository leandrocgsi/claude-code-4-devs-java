# .claude Directory

This directory contains Claude Code configuration and guidance specific to the PetFeliz project.

## Structure

```
.claude/
├── settings.json          # Project-specific Claude Code settings
├── README.md             # This file
└── memories/
    └── git-commit-messages.md  # Commit message patterns and guides
```

## Files

### `settings.json`
Project configuration including:
- Project metadata (name, type, language)
- Development setup (server commands, ports)
- Code style preferences
- Git commit message conventions

This file helps Claude Code understand the project structure and provide better guidance.

### `memories/git-commit-messages.md`
Quick reference guide for writing professional git commit messages for this project.

When you need a commit message, ask Claude Code:
```
Generate a git commit message for: [describe what you did]
```

And it will use these patterns to create a message.

## What Goes Here

✅ **Project-specific configuration**
- Development server setup
- Build/run commands
- Code style guidelines
- Testing patterns

✅ **Project memories & guides**
- Common tasks and patterns
- Commit message conventions
- Architecture notes
- Development workflows

❌ **Should NOT go here**
- Sensitive data (API keys, tokens)
- Large binary files
- User preferences (use `~/.claude/` instead)
- General instructions (use CLAUDE.md at repo root instead)

## For Next Sessions

Future Claude instances will automatically load:
1. `CLAUDE.md` from the project root (architecture & development)
2. `.claude/settings.json` (configuration)
3. `.claude/memories/` (project-specific knowledge)

This combination provides Claude with full context to work effectively on this project.

## Adding More

To add project-specific guidance:
1. Create markdown files in `memories/` for knowledge
2. Update `settings.json` for configuration
3. Use descriptive names and frontmatter (following the format in git-commit-messages.md)

Keep everything focused and avoid duplication with CLAUDE.md.
