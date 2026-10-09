# Plugin capability admission

Plugins are reviewed in-process extensions, not arbitrary third-party code. A plugin can load only when its manifest targets the current host API and every requested capability matches a qualified catalog contract.

## Admission contract

Each manifest declares:

- a registry-matching plugin name and plugin version;
- the exact `hostApiVersion` it was qualified against;
- capability bindings as `{ name, version }` pairs.

Each host capability catalog entry records:

- its stable name, version, scope, access mode, side-effect classification, and exposed methods;
- security qualification status with repository evidence;
- compatibility qualification status, host API version, and repository evidence.

Admission fails closed for missing registrations, host API drift, capability version drift, duplicate bindings, unsupported capabilities, or missing qualification evidence.

## Adding or changing a capability

1. Add or revise the catalog contract in `services/pluginLoader.js`.
2. Expose only the minimum host method needed by the capability.
3. Add containment and authority tests; record their paths as security evidence.
4. Add compatibility tests covering existing plugins and version mismatch; record their paths as compatibility evidence.
5. Increment the capability version for a breaking method or semantic change.
6. Increment the host API version when the plugin execution context changes incompatibly.
7. Update every affected plugin manifest explicitly. Do not add runtime fallbacks that silently grant or translate authority.

The catalog is intentionally static. Dynamic capability installation or admission requires a separate design and security review.
