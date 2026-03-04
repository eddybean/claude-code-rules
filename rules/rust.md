---
paths: **/*.rs
---

# Rust Best Practices

## Ownership and Borrowing

- Prefer borrowing (`&T`, `&mut T`) over cloning; clone only when independent ownership is genuinely needed
- At most one mutable reference OR any number of immutable references to a value at a time — design data flows to respect this, rather than reaching for `RefCell` or `Mutex` as a workaround
- Use `Cow<T>` when a function sometimes needs to borrow and sometimes needs to own — avoids unconditional allocation
- If you find yourself fighting the borrow checker, treat it as a design signal: restructure ownership rather than wrapping everything in `Arc<Mutex<>>`

## Error Handling

- Never use `unwrap()` or `expect()` in library code or production paths — propagate with `?`
- Use `thiserror` to define typed error enums in libraries; use `anyhow` in application code where the specific error type doesn't matter to callers
- Destructors must not fail; provide a separate `close() -> Result<_>` method for fallible teardown
- Document all `panic!` conditions in a `# Panics` section in the doc comment

## Idiomatic Patterns

- Prefer iterator chains (`.filter().map().collect()`) over imperative loops — the compiler optimizes them as well or better
- Use the newtype pattern (`struct UserId(u64)`) to make invalid states unrepresentable at zero runtime cost
- Use the builder pattern for types with more than two optional parameters
- Method names follow the cost convention: `as_` (free, borrowed view), `to_` (allocates/copies), `into_` (consumes ownership)

## Type Design (API Guidelines)

- Every public type should derive `Debug`; also derive `Clone`, `PartialEq`, `Default` where it makes sense
- Implement `From<T>` for conversions, never `Into<T>` directly — the blanket impl provides it for free
- Accept `impl Into<T>` or `impl AsRef<T>` in function signatures to avoid forcing callers to construct a specific type
- Use sealed traits to prevent downstream implementations when the trait is an implementation detail

## Async

- Never call blocking I/O inside an async context — use `tokio::task::spawn_blocking` to offload to a thread pool
- Use `tokio::sync::Mutex` in async code, not `std::sync::Mutex` (holding a std Mutex across an `.await` can deadlock)
- Keep async traits behind `#[async_trait]` (or use RPITIT if on Rust 1.75+) — bare async methods in traits are not object-safe

## Code Quality

- Run `cargo clippy -- -D warnings` in CI; treat clippy warnings as errors
- Run `cargo fmt --check` in CI — formatting is non-negotiable
- Mark `unsafe` blocks with a `// SAFETY:` comment explaining every invariant the caller guarantees
- Minimize the surface area of `unsafe` — encapsulate it in a safe abstraction and document the invariants at the boundary
