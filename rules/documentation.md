# Documentation Best Practices

## Writing Style

- Use active voice and present tense: "The function returns X", not "X is returned by the function"
- Be specific: avoid vague words like "simple", "easy", "just", "obviously"
- Write for the target audience — define terms the reader may not know; omit terms they definitely know

## What to Document

- Document the **why**, not the **what** — code shows what; comments explain intent and trade-offs
- Document non-obvious side effects, preconditions, and invariants
- Add a code example whenever the API contract is not self-evident from the signature

## Keeping Docs Alive

- Update documentation in the same PR as the code change — stale docs are worse than no docs
- Delete documentation that no longer applies; outdated docs actively mislead
- Treat broken documentation links as bugs

## READMEs and API Docs

- Every public module or package needs a README: purpose, quick-start, and link to deeper docs
- Public API surface must have doc comments on every exported symbol
- Use consistent headings so readers can scan: Overview, Installation, Usage, API Reference, Contributing
