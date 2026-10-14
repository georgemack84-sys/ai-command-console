# Nuru Track 2 enrollment

Enroll Nuru once per workspace through `POST /api/platform/integrations/nuru`. This creates or reuses only the stable `nuru` application registration and its versioned read-only capability declarations. Registration leaves Nuru in `DRAFT`; it creates no credential and no grant.

A workspace manager must separately create a Nuru service principal. The returned raw credential is displayed only at issuance/rotation and must be placed in the approved deployment secret manager; it must not enter browser configuration, source control, logs, or workflow snapshots.

An authorized operator must separately transition Nuru from `DRAFT` to `ACTIVE`, then request a narrowed grant for `evidence.retrieve` and its exact workflow resource. A different authorized operator approves that grant. Neither the principal nor credential can impersonate a user or grant itself authority.

Revoking the credential or grant, or suspending the application, immediately denies protected Nuru invocation. Production dispatch remains out of scope.
