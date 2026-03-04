# Clean Architecture

## The Dependency Rule

- Dependencies must point inward: Frameworks → Interface Adapters → Use Cases → Entities
- Inner layers must know nothing about outer layers — no framework imports in domain code
- Data crosses boundaries as simple DTOs or primitives, never as framework-specific objects

## Layers

- **Entities**: Pure business rules; no framework dependencies; the most stable layer
- **Use Cases (Application)**: Orchestrate entities; one use case per user story or command
- **Interface Adapters**: Convert between use case data shapes and external formats (HTTP, DB, etc.)
- **Frameworks and Drivers**: The outermost layer — plug in and replace without touching inner layers

## SOLID in Practice

- **Single Responsibility**: A class/module has one reason to change
- **Open/Closed**: Extend behavior by adding code, not modifying existing code
- **Dependency Inversion**: Depend on abstractions (interfaces), not concretions; inject dependencies
- Prefer composition over inheritance — deep hierarchies are a warning sign

## Practical Rules

- Defer infrastructure decisions (database, HTTP framework) as long as possible
- Make the core domain testable without starting a server, database, or any I/O
- A use case that is hard to unit test is a design smell, not a test tooling problem
