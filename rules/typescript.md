---
paths: **/*.{ts,tsx}
---

# TypeScript Best Practices

## Type Safety

- Avoid `any`; use `unknown` with explicit type guards instead
- Minimize type assertions (`as`); prefer type narrowing with guards
- Enable `strict: true` in `tsconfig.json`

## Functions and Variables

- Explicitly annotate function parameters and return types
- Prefer `const`; use `let` only when reassignment is necessary
- Use object spread for immutable updates instead of mutation

## Modules

- Prefer named exports over default exports
- Use barrel exports (`index.ts`) cautiously — they can hurt tree-shaking
- Avoid circular dependencies by keeping module boundaries clean

## Error Handling

- Use custom error classes that extend `Error`
- In `catch` blocks, treat the caught value as `unknown` and narrow with type guards
- Always handle Promise rejections with `.catch()` or `try/catch`
