# Git Workflow Best Practices

## Branching Strategy

- Prefer trunk-based development (short-lived branches merged to main within days) over long-running feature branches
- Use feature flags or branch-by-abstraction for work that can't fit in a short branch
- Name branches with a type prefix and kebab-case: `feature/TICKET-123-oauth-signin`, `bugfix/TICKET-456-null-crash`, `hotfix/critical-security-patch`
- Delete branches immediately after merging

## Commit Messages (Conventional Commits)

- Follow the format: `<type>[optional scope]: <description>` — e.g., `feat(auth): add OAuth2 sign-in`
- Types: `feat` (→ MINOR), `fix` (→ PATCH), `refactor`, `docs`, `test`, `chore`, `ci`, `perf`
- Breaking changes: add `!` before the colon AND a `BREAKING CHANGE:` footer — both are required for tooling
- Use present imperative tense; no capital first letter; no trailing period
- Body explains **why**, not what — the diff already shows what

## Atomic Commits

- Each commit does exactly one logical thing and leaves the codebase in a working state
- Use `git add -p` to stage specific hunks when a working session touched multiple concerns
- Do not mix formatting changes with logic changes in the same commit — they obscure diffs and complicate bisect

## Pull Requests

- Keep PRs under 250 lines of changed code; review quality drops sharply beyond ~400 lines
- One logical change per PR — not one commit, but one coherent concern
- Write a description that explains **why** the change is being made, not just what it does
- A PR is ready to merge only when all CI checks pass and stale reviews are dismissed on new commits

## Merge Strategy

- **Squash** feature branches into main when the branch has many work-in-progress commits — keeps trunk history clean
- **Rebase** locally before pushing to share a linear history; never rebase a branch others have based work on
- **Merge commit** when integrating release or shared branches where preserving the integration point matters
- Never force-push to a shared branch; create a new commit to revert instead

## What Not to Commit

- Secrets, API keys, credentials, `.env` files — use a secrets manager; scan with `git-secrets` or similar in CI
- Build artifacts, compiled binaries, `node_modules/` — these belong in `.gitignore`
- Personal editor/IDE config (`.vscode/settings.json`, `.idea/`) — use a global gitignore for personal tooling

## Branch Protection

- Require at least one approval and dismiss stale reviews when new commits are pushed
- Require all status checks (tests, lint, type-check) to pass before merge
- Require branches to be up to date with main before merge — ensures CI ran against the final integration point
