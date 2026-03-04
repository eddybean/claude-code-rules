# claude-code-rules (ccr)

A CLI tool to discover, install, and manage rule files for [Claude Code](https://claude.ai/code).

Claude Code dynamically loads `.md` files placed under `.claude/rules/` in your workspace. **ccr** makes it easy to find, install, and organize these rules — both from a curated built-in collection and from any public GitHub repository.

## Features

- **Interactive mode** — browse and install rules with a guided UI
- **Direct mode** — install rules in a single command with arguments
- **`paths` filter support** — scope a rule to specific file patterns (e.g. `src/backend/**`)
- **GitHub integration** — pull rules from any public GitHub repository
- **Workspace & user level** — install rules per-project or globally (`~/.claude/rules/`)
- **Manage rules** — copy, move, and delete rules between workspace and user level
- **Multilingual** — displays in Japanese or English based on your OS locale

## Installation

```bash
npm install -g claude-code-rules
```

Requires Node.js 18 or later.

## Usage

### `ccr add` — Add rules

**Interactive mode** (no arguments):

```bash
ccr add
```

Walks you through selecting a source (built-in or GitHub), choosing rules, and optionally setting a `paths` filter.

**Install a built-in rule directly:**

```bash
ccr add typescript
ccr add react
ccr add security
ccr add testing
```

**Install with a `paths` filter** (rule only applies to matching files):

```bash
ccr add typescript --path "src/**"
ccr add react --path "src/frontend/**"
```

**Install from a GitHub repository:**

```bash
# Interactive rule selection from a repo
ccr add --source https://github.com/owner/repo

# Install a specific rule from a repo
ccr add --source https://github.com/owner/repo my-rule
```

**Install to user level** (`~/.claude/rules/`) instead of the workspace:

```bash
ccr add security --user
ccr add --source https://github.com/owner/repo --user
```

#### `paths` filter

When a rule is installed with a `paths` filter, ccr prepends a YAML frontmatter block:

```markdown
---
paths: src/backend/**
---

# Your rule content here
```

Claude Code will then apply the rule only when working with files matching the glob pattern.

### `ccr list` — List installed rules

```bash
ccr list
```

Shows all installed rules at both the workspace and user level, including their `paths` filter and source.

```
Workspace rules (.claude/rules/)
─────────────────────────────────
  ✓ typescript [paths: src/**]  (bundled)
  ✓ react                       (https://github.com/owner/repo)

User rules (~/.claude/rules/)
──────────────────────────────
  ✓ security  (bundled)
```

### `ccr manage` — Manage installed rules

```bash
ccr manage
```

Opens an interactive UI to:

- **Copy** a rule from workspace to user level (or vice versa)
- **Move** a rule between workspace and user level
- **Edit** the `paths` filter of an installed rule
- **Delete** a rule

## Built-in rules

The following rules are bundled with ccr and available out of the box:

| Rule | Description |
|---|---|
| `typescript` | TypeScript best practices |
| `react` | React / JSX patterns |
| `security` | Security guidelines |
| `testing` | Testing best practices |

## GitHub repository format

When using `--source`, ccr fetches `.md` files from the `rules/` directory of the specified public GitHub repository via the GitHub REST API (no `git clone` required).

```bash
ccr add --source https://github.com/owner/repo
```

If you hit GitHub API rate limits, set a personal access token:

```bash
export GITHUB_TOKEN=your_token_here
```

## Locale

ccr displays messages in **Japanese** when your system locale starts with `ja` (e.g. `LANG=ja_JP.UTF-8`), and in **English** otherwise.

```bash
LANG=ja_JP.UTF-8 ccr list  # Japanese
LANG=en_US.UTF-8 ccr list  # English
```

## License

MIT
