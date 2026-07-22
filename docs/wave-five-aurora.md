# Wave 5.12 Aurora

Wave 5.12 establishes Aurora as the primary conversational experience for the Personal Applications portfolio. It provides governed natural-language interaction, context assembly, intent resolution, action routing, briefings, explanations, conversational memory, guided workflows, and advisory recommendations across Wave 5 applications.

## Constitutional Boundary

Aurora is an orchestrator. It does not own business logic, make authoritative application decisions, bypass constitutional governance, assemble unauthorized context, perform direct privilege escalation, or operate as an unrestricted superuser. Execution remains delegated to governed application APIs.

## Platform Capabilities

- Conversational Interface for natural language, voice-ready architecture, structured command parsing, multi-turn continuity, clarification, sessions, accessibility, and conversation registry.
- Briefing Engine for daily briefings, mission summaries, tasks, calendar, health, finance, projects, research, learning, cross-domain summaries, prioritization, evidence-backed summaries, and governed action suggestions.
- Context Assembly for minimum necessary identity, time, mission, preference, and cross-application context with permission filtering, source governance, freshness checks, tenant isolation, and authorization boundaries.
- Action Router for deterministic intent resolution, service discovery, capability selection, request transformation, authorization validation, governance enforcement, execution monitoring, result aggregation, failure handling, and retry coordination.
- Explanation Engine for decision explanations, evidence references, policy explanations, restriction explanations, context summaries, confidence, action lineage, recommendation rationale, governance trace, and human-readable narratives.
- Governance and Security for constitutional governance, Mission Lifecycle Contract, Policy Engine, Safety Gate, Evidence Services, Replay Services, Certification Services, CATA Trust Framework, least privilege, delegated authority, tenant boundaries, privacy, and evidence visibility.
- Memory and Guided Workflows for governed conversation state, active objectives, clarification history, referenced entities, pending actions, planning, writing, research, scheduling, review, learning, project management, and mission execution.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-critical conversational, briefing, workflow, explanation, or monitoring surfaces degrade to `CONDITIONALLY_QUALIFIED`. Constitutional failures such as invalid Aurora application state, unauthorized context assembly, source-governance bypass, tenant context leak, nondeterministic routing, direct business logic execution, governed API bypass, missing authorization validation, privilege escalation, unrestricted superuser authority, missing evidence, unauthorized evidence visibility, privacy disclosure, memory policy bypass, non-advisory recommendations, or replay divergence produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-five-aurora/contract`
- `POST /api/wave-five-aurora/validate`
- Section endpoints: `conversation`, `briefing`, `context-assembly`, `action-routing`, `explanation`, `governance-security`, `memory-workflows`, and `readiness`
