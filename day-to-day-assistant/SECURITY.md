# Security Policy

## Reporting

Report vulnerabilities privately to the repository owner. Do not place vulnerability details, exploit examples, secrets, or sensitive personal data in public issues, commits, logs, screenshots, or pull-request comments.

## Secret Handling

Secrets must live in local environment files or a future approved secret store. `.env` files, tokens, private keys, credentials, and personal data exports must not be committed.

## Supported Releases

During bootstrap, only the current private development version is supported. A formal support matrix will be added before a public or shared release.

## Required Controls

Material actions must be authorized server-side, confirmed by the authenticated user, auditable, and fail closed on uncertainty.
