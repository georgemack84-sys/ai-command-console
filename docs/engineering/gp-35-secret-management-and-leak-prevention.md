# GP-35 Secret Management and Leak Prevention

**Status:** Implemented

## Outcome

GP-35 consolidates Proprium's secret boundary across tracked source, runtime configuration, generated artifacts, frontend delivery, Docker build contexts, CI, diagnostics, and incident response. It extends the GP-04 controls with artifact sentinels and additional provider, workflow, and Docker checks. It does not select a production vault or add encrypted secrets to Git.

## Classification

| Class | Examples | Handling |
| --- | --- | --- |
| Public | application name/version, host, port, environment name, browser API URL | May be tracked or browser-delivered when owned by the public schema |
| Sensitive non-secret | internal topology and operational metadata | Minimize distribution; do not treat as an authentication factor |
| Secret | passwords, private/signing keys, session and privacy keys, provider credentials, credential-bearing URLs | Runtime injection only; never tracked, logged, returned, bundled, or baked into an image |

A URL becomes secret-bearing when it embeds a credential. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` remains the single reviewed public-token naming exception; it does not weaken any other `NEXT_PUBLIC_*` restriction.

## Origins, sinks, and ownership

Real secrets may originate only from an ignored component-local environment file, the invoking process environment, an approved CI/container secret mechanism, or a future approved provider in the reserved backend precedence slot. The API deliberately does not load `.env` or Development User Secrets. Build arguments, command-line configuration, source defaults, and tracked templates are not secret origins.

Secrets must not reach source, templates, logs, exception text, telemetry, OpenAPI, browser artifacts, workflow output, Docker layers/history, snapshots, or generated reports. Typed backend options own redaction and validation; frontend configuration owns only its exact public inventory. A future provider must return values through the existing typed boundary and must not expose raw provider exception messages.

## Mechanical controls

`npm run validate:secrets` scans the complete Git-tracked tree and reports only path, line, rule, and safe remediation text. It rejects:

- tracked local environment or credential-container files;
- private-key markers, GitHub/OpenAI/AWS token signatures, Azure account keys, and unapproved credential URLs;
- unsafe sensitive literals in templates, ASP.NET configuration, workflows, Dockerfiles, and Compose;
- secret-shaped public frontend names;
- broad configuration dumps and raw backend exception logging;
- workflow environment dumps or commands that print secret expressions;
- secret-shaped Docker `ARG`/`ENV`, credential-file copies, or secret-printing build commands; and
- an incomplete `.dockerignore` secret boundary.

The scanner has no blanket exclusions. Its only exceptions are exact reviewed harness profiles, the exact public Mapbox identifier, and explicit disposable placeholder classifications. Candidate values are never printed. Negative tests assemble signatures at runtime so the fixtures do not themselves become tracked candidates.

`npm run test:secret-safety` covers private keys, provider tokens, Azure credentials, credential-bearing database URLs, public-name rejection, Docker/CI primitives, artifact sentinels, and safe public artifacts. CI runs the tracked-tree scan before broader repository validation.

## Generated artifact proof

The OpenAPI exporter uses synthetic typed configuration. Its validator scans the generated document for those secret sentinels and for the tracked-tree signatures before accepting the contract. The frontend CI build receives a server-only test sentinel and scans the browser-delivered `.next/static` output immediately after the production build. Neither scan prints a candidate value.

Docker builds inherit `.dockerignore` exclusions for all local environment profiles and common credential containers. Static policy rejects secret build arguments, image-layer secret environment instructions, credential copies, and build-time printing. Runtime Compose values are injected only when a container starts; the application Dockerfiles contain no secret input channel.
The canonical Docker validation command runs that policy before resolving Compose or building either application image, then scans all three final image configurations and complete histories for secret signatures and secret-shaped environment entries.

## CI and runtime policy

Current CI requires no real secret for its validation fixtures. If a future job needs one, it must use the CI platform's secret store, pass it only to the owning runtime step, mask it, and avoid shell tracing, environment dumps, command-line arguments, artifacts, caches, and diagnostic uploads containing the value. A job failure does not authorize printing configuration or raw container environments.

Production and shared-environment rotation is a value replacement in the approved external source followed by restart/redeployment. It never requires a source edit or frontend rebuild. Local disposable values may be replaced in ignored local configuration.

## Exposure response

A real or plausibly real committed or emitted secret is permanently compromised. Stop propagation, record only the location and owner, revoke or rotate immediately, invalidate dependent sessions, remove the value from current source/artifacts, and assess Git history, forks, caches, workflow logs, container registries, images, and downloads. History rewriting may reduce further distribution but never substitutes for revocation.

The detailed operator sequence remains in the [GP-04 exposure response](gp-04-secret-safety.md#exposure-response). History scanning is an audit and incident-response tool, not the primary merge gate; the deterministic merge gate scans the complete tracked tree on every change.

## Deferred decisions

Production vault selection, workload identity and IAM design, automated rotation, certificate lifecycle, encrypted-in-Git workflows, organization-wide DLP, and registry-native image scanning remain separate architecture and deployment decisions.
