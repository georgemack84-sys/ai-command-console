# GP-35 Secret Management and Leak Prevention Validation

## Qualification matrix

| Control | Evidence | Result |
| --- | --- | --- |
| Tracked tree and local environment boundary | `npm run validate:secrets`; Git tracked/ignore inspection | Pass |
| Private key, GitHub/provider token, Azure credential, credential URL | Runtime-assembled negative fixtures in `npm run test:secret-safety` | Pass |
| Public frontend API URL | Safe artifact fixture and frontend schema validation | Pass |
| Server-only frontend value | Production `.next` build scanned with a synthetic server-only sentinel | Pass |
| OpenAPI configuration values | Generated OpenAPI scanned for synthetic password and key sentinels | Pass |
| Backend logs and exceptions | Tracked-tree dump/raw-exception rules plus GP-33 redaction tests | Pass |
| Docker context, instructions, images, and history | `.dockerignore` semantic rule, Dockerfile negative fixtures, and final image configuration/history scan | Pass |
| CI ordering | Workflow contract requires tracked-tree scan before repository validation and browser scan immediately after build | Pass |

## Commands

```text
npm run test:secret-safety
npm run validate:secrets
npm run test:ci-workflow
npm run validate:openapi
npm run repo -- validate docker
npm run validate:repository
```

Frontend artifact qualification uses the same production build as CI with a non-public sentinel present only in the build process environment, followed by `npm run test:secret-isolation` in `apps/web`.

## Notes

All negative fixtures are synthetic and constructed at runtime. Scanner and artifact failures suppress matched values. No real credential, infrastructure service, production secret provider, or network listener is required by the secret-safety tests.
