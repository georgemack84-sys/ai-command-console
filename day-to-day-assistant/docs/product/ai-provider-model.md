# AI Provider Model

Phase 6 exposes three provider categories through one gateway: `mock`, `hosted`, and `local`.

The mock provider produces deterministic offline responses for tests and local development. Hosted and local provider adapters are represented behind the same interface, with live calls deferred to a later hardening pass.

Provider settings are stored per user and include provider, model, temperature, max tokens, and timeout.
