# ADR-012: Storybook as a production-parity UI environment

Status: Accepted

## Context and decision

Storybook uses the production style entry point, `StorybookProviders`, the `proprium-overlay-root` contract, real theme preferences, and canonical breakpoint language. Token, responsive, and provider smoke stories prove the foundation; the a11y addon exposes accessibility feedback.

## Alternatives, consequences, and enforcement

Storybook-only tokens, themes, and component behavior are prohibited. The approved Storybook package family is documented in `docs/approved-dependencies.md`; `storybook:build` is the static parity validation command.
