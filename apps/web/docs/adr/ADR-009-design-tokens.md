# ADR-009: Design tokens and styling ownership

Status: Accepted

## Context and decision

Runtime design tokens are CSS custom properties. Primitive values live in `styles/tokens/primitives.css`; semantic values map purpose to primitives in `semantic.css` and `themes.css`. Components consume semantic tokens, not raw colors. Breakpoints live exclusively in `src/config/breakpoints.ts`.

## Alternatives, consequences, and enforcement

CSS-in-JS, component-local palettes, and independently named breakpoints were rejected. New token families require token-layer changes and review. Shared styles load reset, primitives, semantic mappings, themes, globals, then component styles. Storybook imports this same entry point.
