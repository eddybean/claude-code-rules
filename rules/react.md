# React Best Practices (v19)

## Component Design

- Default to Server Components when using a framework (Next.js, etc.); add `'use client'` only for interactivity, browser APIs, or local state
- Place `'use client'` boundaries as low in the tree as possible — high placement forces large static subtrees to hydrate
- Pass `ref` directly as a prop in React 19; `forwardRef` is deprecated
- One component, one responsibility — split when a component handles two distinct concerns

## Hooks and Memoization

- Do not add `useMemo`, `useCallback`, or `React.memo` preemptively — profile with React DevTools Profiler first
- The React Compiler (stable in v19) auto-memoizes when enabled; manual memoization fights it
- `useEffect` dependency arrays must be accurate; never silence the exhaustive-deps lint rule
- `useTransition` marks state updates as low-priority and causes double renders — use only for search/filter UI where typing latency matters; do not apply it broadly

## Async State and Forms (React 19)

- Use `useActionState` for async form submissions — it provides state, a dispatch function, and an `isPending` flag in one call
- Use `useOptimistic` for instant UI feedback before a server response; the optimistic state reverts automatically on error
- Use `useFormStatus` inside a form to read the parent form's pending state without prop drilling
- Return structured error state from Server Actions rather than throwing; thrown errors reach the nearest error boundary, not the form UI

## State Management

- Start with `useState` for local state and `useReducer` for complex multi-field state
- Use React Query (or SWR) for server state — it handles caching, deduplication, and background refetch
- Reach for a global store (Zustand, Jotai) only for state that is genuinely app-wide; most state is not
- Derive values during render instead of synchronizing with a second `useState`

## Suspense and Error Boundaries

- Wrap async subtrees in `Suspense` to enable streaming and progressive rendering
- Group logically related async components under one `Suspense` boundary — too-granular boundaries create loading waterfalls
- Use `ErrorBoundary` (via `react-error-boundary`) around risky subtrees; provide a "Try again" action, not just an error message
- Error boundaries do not catch errors in event handlers or async code — handle those with `try/catch`
