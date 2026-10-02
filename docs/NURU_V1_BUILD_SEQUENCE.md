# Nuru V1 Build Sequence

1. Foundation: repository architecture, domain, configuration, database, migrations, API.
2. Core services: metadata, archive, audit, permissions.
3. Knowledge infrastructure: search, embeddings, relationships, sources, provenance.
4. Agent platform: runtime, tool registry, identities, structured outputs.
5. Discovery and Context agents.
6. Connection and Quality agents.
7. Curator, workflows, budgets, model routing.
8. Proposals, governance, human approval.
9. Dashboard, review queue, knowledge and relationship explorers.
10. Observability, replay, evaluations, security hardening, acceptance.

The present application keeps API routes, web UI, workers, agents, services,
governance, runtime, tools, workflows, events, and evaluations in modular Nuru
directories. These can be extracted into `apps/api`, `apps/web`, and `apps/worker`
when deployment scale warrants it, without changing the authority boundaries.
