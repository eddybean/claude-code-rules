---
paths: **/*.{graphql,tgql}
---

# GraphQL Best Practices

## Schema Design

- Every object type must have an `id: ID!` field — owned and controlled by the API, never by clients
- Avoid nullable lists with nullable items; use `[Item!]!` (empty list = no results) as the default
- Design the schema as a business graph, not a mirror of your database tables
- Keep the mutation surface minimal — expose only necessary operations to reduce the attack surface

## N+1 Problem (Critical)

- Use DataLoader (or equivalent batching) in every resolver that fetches from a data source
- DataLoader must correctly map each request key to its response item — one misaligned key causes silent bugs
- Unprotected N+1 queries are a DoS vector; treat DataLoader as non-optional, not an optimization

## Pagination

- Use cursor-based pagination exclusively — offset pagination breaks with concurrent mutations
- Follow the Relay connection spec: `edges { cursor node }` + `pageInfo { hasNextPage endCursor }`
- Enforce a maximum page size (e.g., 250 items); document it and return an error when exceeded

## Queries

- All client queries must be static strings — never concatenate or construct queries at runtime
- Use variables for dynamic values; use fragments to share field selections across queries
- Request only the fields needed; GraphQL's value is eliminated when clients over-fetch

## Error Handling

- Include an `errors` array in partial responses — GraphQL allows mixed success/error results
- Use structured extensions: `{ message, extensions: { code, path } }` so clients can switch on `code`
- Sanitize error messages in production; log full details server-side

## Security

- Enforce query depth limits (max ~10 levels) and field complexity budgets to block malicious queries
- Rate-limit per authenticated user using a sliding-window or token-bucket algorithm
- Disable introspection in production or restrict it to authenticated users
