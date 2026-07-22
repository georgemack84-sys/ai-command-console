# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository maintainer using GitHub's private security advisory flow when available. Do not open a public issue or include proof-of-concept details in a pull request.

Include a concise description, affected area, reproduction steps, impact, and any suggested mitigation. You will receive an acknowledgement as soon as practical; the maintainer will coordinate investigation, remediation, and disclosure timing.

## Handling expectations

Security-sensitive changes require a documented impact assessment, validation evidence, and a review of secrets, authentication, authorization, dependency, and data-handling implications. Secrets must never be committed; use local environment files and the deployment platform's secret store.
