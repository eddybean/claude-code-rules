---
paths: {app,components,hooks,lib,types}/**/*.{ts,tsx}
---

# Next.js Best Practices (v15 / App Router)

## Server vs Client Components

- All components are Server Components by default — add `'use client'` only when you need interactivity, browser APIs, or local state
- Push `'use client'` boundaries as low in the tree as possible; placing them high forces large static subtrees to hydrate unnecessarily
- A Server Component can render a Client Component as a child, but not the reverse — pass Server Components as `children` props to work around this

## Data Fetching

- In Next.js 15, `fetch` is **not cached by default** — opt into caching explicitly: `fetch(url, { cache: 'force-cache' })` or `{ next: { revalidate: 60 } }`
- Use the `'use cache'` directive (React 19 integration) to cache async functions and DB queries; prefer it over the deprecated `unstable_cache`
- Using `cookies()`, `headers()`, or `searchParams` in a component makes the entire route dynamic — do so intentionally
- Wrap slow data fetches in `Suspense` so the server can stream the static shell immediately; without it, streaming is blocked

## Server Actions

- Server Actions are public HTTP endpoints even if not linked anywhere — always authenticate and authorize inside the action
- Validate all input with a schema library (Zod, Valibot) before use; never trust client-supplied form data
- Call `revalidateTag()` or `revalidatePath()` after mutations to keep caches consistent
- Organize actions in dedicated files (`app/actions/orders.ts`) rather than co-locating with components

## Rendering Strategy

- Static (SSG): default when no dynamic functions or uncached fetches are present — fastest, use for stable content
- ISR: export `export const revalidate = N` to rebuild on a schedule without a full redeploy
- PPR (Partial Prerendering, experimental): prerender the static shell at build time, stream dynamic `Suspense` subtrees — best of SSG and SSR
- Enable PPR per route with `export const experimental_ppr = true` and `ppr: 'incremental'` in `next.config.ts`

## Routing

- Use route groups `(name)` to share layouts or organize code without adding URL segments
- Use parallel routes (`@slot`) to render independent sub-pages in the same layout (e.g., dashboards with separate data streams)
- Use intercepting routes `(.)path` combined with parallel routes to build modals that preserve a shareable URL
- `params` is a `Promise` in Next.js 15 — always `await params` before accessing properties

## Performance

- Turbopack is the default bundler in Next.js 15 and production-ready — no configuration needed
- Load all fonts through `next/font`; load third-party scripts through `next/script` with `strategy="afterInteractive"` to protect Core Web Vitals
- Avoid sequential async waterfalls — fetch independent data in parallel with `Promise.all`

## Security

- Prefix env variables with `NEXT_PUBLIC_` only when client exposure is intentional; all others are server-only by default
- Never import database clients or ORMs in files that may be bundled for the client
- Keep Next.js patched — critical RSC-layer vulnerabilities (e.g., CVE-2025-66478) have been addressed in patch releases
