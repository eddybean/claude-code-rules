# Domain-Driven Design (DDD)

## Ubiquitous Language

- Every domain concept has exactly one name used consistently by developers and domain experts
- Never let technical terms (`UserRecord`, `DataObject`) leak into the domain layer
- Update the code when the domain language evolves — code is the primary expression of the model

## Building Blocks

- **Entity**: Has a unique identity that persists through state changes (e.g., `Order` with `OrderId`)
- **Value Object**: Defined entirely by its attributes; always immutable; compare by value not reference
- **Aggregate**: A cluster of Entities/Value Objects with one Aggregate Root that enforces invariants
- Only reference an Aggregate from outside via its Root — never reach inside to sub-entities directly

## Repositories

- Repositories abstract persistence behind a collection-like interface
- One Repository per Aggregate Root — not per entity or table
- Keep query logic out of the domain; push complex queries to dedicated Query Objects or Read Models

## Bounded Contexts

- A Bounded Context is the explicit boundary within which a domain model applies consistently
- The same word (e.g., "Customer") can mean different things in different Bounded Contexts — that is intentional
- Map relationships between Bounded Contexts explicitly (Anti-Corruption Layer, Shared Kernel, Open Host Service)
