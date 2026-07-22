# Coding Standards

## Python

Use type hints, explicit return types, centralized configuration, structured exceptions, validated payloads at module boundaries, formatted code, and linted code.

## TypeScript

Use strict mode, typed API clients, validated external data, accessible UI components, explicit loading states, and explicit error states. Avoid uncontrolled `any`.

## Naming

Python modules use snake_case. Python classes use PascalCase. TypeScript variables use camelCase. TypeScript components use PascalCase. Database tables use snake_case plurals. API resources use lowercase plural nouns. Environment variables use UPPER_SNAKE_CASE. Event types use UPPER_SNAKE_CASE.

## API

Routes are versioned, request and response bodies are typed, errors use stable structures, correlation IDs are carried, collections paginate, retryable state changes are idempotent, authorization checks run server-side, and audit events are created where required.

## Source Control

Commits should be focused and descriptive. No secrets may be committed. Pull requests require passing checks and a linked change description.
