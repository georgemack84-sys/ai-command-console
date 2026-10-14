# Phase 6.6 — Staging Integration Readiness

**Status:** Read-only preflight available; all dispatch outside the built-in local sandbox remains disabled.

## Purpose

The reference workflow can now report whether its two independently deployed staging endpoints have been configured. This is configuration evidence only; it grants no authority and never enables egress.

## Required deployment configuration

```dotenv
WORKFLOW_STAGING_NURU_BASE_URL=https://nuru-staging.example.invalid/
WORKFLOW_STAGING_HEADLINE_FLOW_BASE_URL=https://headline-flow-staging.example.invalid/
```

Credentials must be stored in the deployment secret manager and supplied by an authorized operator at execution time. Do not put service credentials in source control or browser configuration.

## Promotion gates

Before a separately approved staging adapter can be introduced, both endpoints must pass contract verification for authentication, scoped authorization, correlation, idempotency, bounded timeout, retry classification, and non-publication. A later policy decision is required before production dispatch can exist.
