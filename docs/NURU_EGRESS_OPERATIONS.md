# Nuru egress operations

NSI retrieval runs only in the `external-worker` profile. The worker has no
direct route to the internet: it can reach the internal application network and
the `nuru-egress-proxy` only. The proxy is the sole service attached to the
external network.

## Approving a retrieval domain

Before a source can be retrieved in staging or production, add its domain suffix
to `docker/nuru-egress/allowed-domains.txt` and review it as a deployment change.
For example, `publisher.example.com` permits only that hostname while
`.publisher.example.com` permits its subdomains. Do not use a wildcard, IP
address, private domain, or an overly broad public suffix.

The proxy denies all destinations by default, limits traffic to ports 80 and
443, denies private, loopback, link-local, multicast, and documentation address
ranges, and does not expose a host port. Application-level DNS checks still run
before every request and redirect.

## Starting staging

1. Set `JOB_QUEUE_EXECUTION_MODE=external`, `NURU_EGRESS_PROXY_REQUIRED=true`,
   and the Redis settings in the staging secret environment.
2. Review and populate the domain allowlist.
3. Start with `docker compose -f docker-compose.staging.yml --profile external-worker up -d`.
4. Confirm that the worker receives `NODE_USE_ENV_PROXY=1`, and matching
   `HTTP_PROXY`, `HTTPS_PROXY`, and `NURU_EGRESS_PROXY_URL` values.
5. Exercise an approved source and an unapproved source. The approved request
   must succeed; the unapproved request must be denied by the proxy. Retain both
   results as release evidence.

The worker fails closed before any NSI fetch when proxy enforcement is required
but not active. Never put credentials in the allowlist or proxy URL; use the
deployment secret store for proxy authentication if it becomes necessary.
