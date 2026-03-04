---
paths: **/*.go
---

# Go Best Practices

## Code Style

- Always run `gofmt` (or `goimports`) before committing — no exceptions
- Follow the Go proverb: clear is better than clever
- Keep package names short, lowercase, singular — no underscores or camelCase

## Error Handling

- Always handle errors explicitly; never use `_` to discard an error return
- Wrap errors with `fmt.Errorf("context: %w", err)` to preserve the chain
- Reserve `panic` for programmer errors (violated preconditions), not for runtime failures

## Concurrency

- Share memory by communicating via channels; do not communicate by sharing memory
- Use `sync.Mutex` only when channels would introduce unnecessary complexity
- Always ensure every goroutine has a defined exit path — prevent goroutine leaks

## Design

- Accept interfaces, return concrete structs — keep interfaces small (1-3 methods)
- Design types so their zero value is useful and safe without explicit initialization
- Prefer multiple return values over out-parameters; use the "comma ok" idiom for optional results
