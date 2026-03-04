# Testing Best Practices

## Test Design

- Structure tests with AAA: Arrange, Act, Assert — one assertion per test as the default
- Name tests as "given [context], when [action], then [outcome]"
- Test observable behavior, not internal implementation details

## Unit Tests

- Replace external dependencies (DB, API, filesystem) with mocks or fakes
- Always cover boundary values, edge cases, and error paths
- Tests must be order-independent and runnable in isolation

## Integration and E2E Tests

- Prioritize E2E coverage of critical user flows over exhaustive unit coverage
- Keep the test environment as close to production as possible
- Set up and tear down test data within each test — no shared mutable state

## Coverage

- Coverage percentage is a proxy metric — prioritize coverage of critical business logic
- Aim for 80%+ coverage on core logic paths
- Generate coverage reports in CI and fail the build when it regresses
