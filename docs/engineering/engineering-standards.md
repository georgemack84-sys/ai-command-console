# Engineering Standards

## Naming and ownership

Use clear, domain-oriented names; keep files and symbols small enough to understand in context. Keep code within the owning application, service, package, or infrastructure area. Cross-boundary dependencies must be explicit and justified.

## Quality expectations

Every change needs an appropriate test or recorded reason one is not applicable. Keep documentation and configuration aligned with behavior. Review security impact, including secrets, authorization, dependencies, data exposure, and operational effects.

## Pull request expectations

Describe the change and its purpose, record validation, update documentation as needed, and disclose security and configuration impact. UI changes include screenshots. Material changes use the Solo Maintainer Review checklist.

## Future feature definition of done

Starting with product-feature work, completion also requires authorization, accessibility, observability, logging, testing, documentation, migrations where applicable, and operational readiness. These product criteria do not retroactively block the repository-governance foundation.
