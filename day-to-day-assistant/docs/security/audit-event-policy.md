# Audit Event Policy

## Scope

Audit events record security-relevant account, login, session, password, settings, and system actions.

## Metadata Rules

Allowed metadata includes changed field names, route, result, reason code, target session ID, non-sensitive previous/new state, and application version.

Metadata must not include passwords, session tokens, API keys, encryption keys, authentication cookies, or full secret-bearing payloads. Metadata redaction is enforced in the audit writer.

## Retention

Security audit events are retained indefinitely for the local application and included in backups. Ordinary UI deletion is not provided.
