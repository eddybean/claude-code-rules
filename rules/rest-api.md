# REST API Design Guidelines

## Naming and URL Structure

- Use plural nouns for resource paths: `/users/{id}` not `/user/{id}`
- Path segments use kebab-case; JSON payload fields use snake_case
- No trailing slashes — they may be treated as distinct resources by caches and proxies
- Nest sub-resources at most one level deep: `/users/{id}/orders`, not `/users/{id}/orders/{id}/items/{id}`

## HTTP Methods and Status Codes

- `201 Created` after successful POST; include `Location` header pointing to the new resource
- `202 Accepted` for async operations; include a status polling endpoint in the response
- `204 No Content` for successful updates/deletes with no response body
- `422 Unprocessable Entity` for validation failures, `409 Conflict` for state conflicts — don't default to 400/500

## Error Responses

- Return a structured error object, not a plain string: `{ "error": { "code": "ORDER_NOT_FOUND", "message": "..." } }`
- Never expose stack traces or internal details to clients; log them server-side only
- Use a finite, documented set of error codes (~20 max) so clients can handle every case

## Versioning

- Avoid embedding versions in the URL (`/v1/`) for long-lived APIs; prefer `Accept` header versioning
- Treat any breaking change (removed field, changed type, new required param) as a major version bump
- Give clients at least 6 months notice before removing a version

## Pagination and Filtering

- Prefer cursor-based pagination over offset — offsets break when records are inserted or deleted concurrently
- Use `has_more` (boolean) instead of returning total counts; total counts are expensive and rarely needed
- Support field selection via `?fields=id,name` to prevent over-fetching

## Security

- Authenticate every endpoint by default; explicitly opt out for public endpoints with documentation
- Use scoped OAuth 2.0 tokens; name scopes with reverse-DNS convention (`api:read:orders`)
- Propagate `X-Request-ID` across service calls; log it on every request for traceability
