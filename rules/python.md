# Python Best Practices

## Type Annotations

- Annotate all function signatures with types; use `from __future__ import annotations` for forward refs
- Use `X | None` (Python 3.10+) or `Optional[X]` for nullable values
- Run mypy or pyright in strict mode on CI

## Common Pitfalls

- Never use mutable defaults in function signatures — use `None` and assign inside the function body
- Avoid bare `except:`; always catch a specific exception type
- Do not use `assert` for runtime validation in production code — it is disabled with the `-O` flag

## Style (PEP 8)

- Maximum line length: 88 characters (Black default) or 79 (strict PEP 8)
- Import order: stdlib → third-party → local; enforce with isort
- Name classes `PascalCase`, functions and variables `snake_case`, constants `UPPER_SNAKE_CASE`

## Resource Management

- Use context managers (`with`) for all file and network I/O
- Prefer `pathlib.Path` over `os.path` for filesystem operations
- Avoid `global` and `nonlocal`; pass state explicitly through function arguments
