# ADR-008: Frontend UI architecture and ownership boundaries

Status: Accepted

## Context and decision

The frontend needs reusable UI without route or shell coupling. `ui` owns reusable visual foundations; `shell` owns application composition; `providers` composes providers; `theme` owns theme behavior; `config` owns shared configuration. Dependencies only flow downward: app → shell/providers/ui/theme/config; shell → ui/theme/config; providers → theme/state/ui/config; ui → theme/config; theme → config.

## Alternatives, consequences, and enforcement

Feature-local components and imports from routes were rejected because they undermine reuse. UI may not import shell or app, and lower layers may not import higher layers. Dependency-cruiser and its passing/failing fixtures enforce this; external consumers use public module entry points.
