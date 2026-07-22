# Testing Standards

Every feature must include appropriate unit, integration, authorization, failure, regression, and migration tests. Assistant behavior tests should use deterministic fixtures and mock providers.

State-changing features require tests for proposal creation, confirmation validation, idempotency, execution verification, audit events, and uncertain outcome handling.

Architecture tests are implemented with NetArchTest for .NET boundaries and dependency-cruiser for TypeScript/package boundaries. Until those tools are installed, architecture-test checklist items remain tracked readiness gaps rather than implicit Day 1 blockers.
