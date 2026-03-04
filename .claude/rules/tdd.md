# Test-Driven Development (TDD)

When modifying source code, follow the rules below. For non-behavioral changes such as documentation updates, these rules may be ignored.

## The Three Laws (Kent Beck)

1. Write no production code until you have a failing test
2. Write only enough test code to produce a single failure (compile errors count)
3. Write only enough production code to pass the current failing test

## Red-Green-Refactor Cycle

- **Red**: Write a failing test that precisely specifies the next desired behavior
- **Green**: Write the simplest code that makes the test pass — correctness first, elegance second
- **Refactor**: Clean up without changing behavior; run tests after every change
- Never skip the refactor step — accumulated design debt defeats the purpose of TDD

## Discipline

- Commit after Green; never commit with failing tests
- If a test is hard to write, treat it as a design signal — the production code is likely too coupled
- Do not change the test to make it pass; change the implementation
- When a bug is found, write a failing test that reproduces it before fixing it