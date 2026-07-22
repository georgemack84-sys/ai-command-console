# Connector Framework

Phase D2D.11 adds optional external connectors without weakening the local-first architecture.

Connectors are isolated by provider, type, scopes, authorization, health, and synchronization history. Business logic talks to the connector framework rather than a provider-specific implementation. The initial providers are local mock adapters for email, calendar, contacts, and storage so the framework is deterministic and testable without external network access.

Every connector requires explicit user authorization. Requested and granted scopes are visible. Unsupported permissions are rejected. Disconnecting a connector revokes its authorization and leaves local application data intact.

Credential material is stored in scoped token envelopes, never plaintext passwords, and authorization records are redacted before being returned through the API.
