# Security Guidelines

## Input Validation

- Validate all user input at system boundaries — never trust client-supplied data
- Use parameterized queries (prepared statements) to prevent SQL injection
- HTML-escape all output to the DOM to prevent XSS
- Never interpolate user input into shell commands

## Authentication and Authorization

- Store passwords with bcrypt or Argon2 — never MD5 or SHA-1
- Keep JWT access token lifetimes short; use refresh tokens for longevity
- Apply the Principle of Least Privilege to every role and API scope

## Secrets

- Store secrets and API keys in environment variables, never in source code
- Add `.env` files to `.gitignore` before the first commit
- Never log passwords, tokens, or PII — scrub before writing to any log sink

## Dependencies

- Run `npm audit` (or equivalent) regularly and on CI
- Keep dependencies on the latest stable minor/patch versions
- Commit lock files (`package-lock.json`, `yarn.lock`) to pin the dependency graph
