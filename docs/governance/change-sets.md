# Nuru change sets

A change-set record describes a Nuru task before its implementation is committed. Records live in `config/change-sets/` and use the stable ID format `NURU-CS-####`.

Every record declares a purpose, expected areas and paths, dependencies, commands required for qualification, and its lifecycle status. `UNKNOWN` ownership or changed paths outside the expected boundary are deliberately left for the qualification stages; this stage records intent rather than silently widening it.

Use `npm run validate:change-sets` to validate the registry. Use `npm run change-set:status -- NURU-CS-0019` to inspect an active record and current working-tree entries without changing them.
