# ADR-011: Pre-hydration theme bootstrap

Status: Accepted

## Context and decision

The standalone browser script `scripts/theme-bootstrap.js` applies the resolved root theme before interactive React code. A build/dev copy step serves it from `public`. It accesses no React state or application store and fails safely to light.

## Alternatives, consequences, and enforcement

React-effect-only initialization and an inline hand-maintained script are prohibited. Bootstrap logic uses the same validation and resolution matrix as the TypeScript module and is covered by the theme test contract. The external script supports a future CSP nonce/hash policy without introducing inline executable content.
