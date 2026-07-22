# Password Policy

## Rules

- Minimum length: 12 characters
- Maximum length: 256 characters
- Password confirmation required for setup and password change
- Common placeholder passwords rejected
- Spaces and passphrases allowed
- No composition rule is required when length is sufficient

## Hashing

The current dependency-light bootstrap implementation uses PBKDF2-HMAC-SHA256 with 600,000 iterations and a 128-bit random salt through Python standard-library primitives. Phase 2 remains conditionally qualified until Argon2id or bcrypt is added through reviewed dependency work, matching the roadmap recommendation.

Plaintext passwords, hints, previous plaintext values, and password values in audit metadata are prohibited.
