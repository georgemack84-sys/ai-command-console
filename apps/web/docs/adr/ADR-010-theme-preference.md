# ADR-010: Theme preference, resolution, and persistence

Status: Accepted

## Context and decision

The only preferences are `light`, `dark`, and `system`; only `light` and `dark` are rendered. The storage key is `proprium.theme.preference`. Invalid, unavailable, or absent storage resolves to `system`; unavailable system detection resolves to light. The root contract is `html[data-theme="light|dark"]`.

## Alternatives, consequences, and enforcement

`class=dark`, body attributes, and invalid-value normalization are prohibited. Storage failures do not block in-memory updates. Unit tests cover validation, resolution, storage, and root application.
