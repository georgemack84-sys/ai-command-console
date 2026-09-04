# Phase 40 — Noesis Strategy Selection Engine

## Outcome

Phase 40 selects a learning strategy as a reproducible, advisory policy decision. It uses a multi-label objective profile, Phase 37 hard eligibility, and Phase 39 contextual evidence; it does not execute learning, approve a plan, grant a lease, alter a strategy, or expand capability.

## Decision policy

Hard governance, prerequisite, resource, registry-lifecycle, risk, and evidence constraints filter candidates before ranking. Eligible candidates receive a configurable, versioned score. The record retains the classifier, policy, registry, and evidence-snapshot versions so it can be replayed. Sparse evidence remains sparse: high-risk objectives require supported evidence, and security-critical objectives additionally require adversarial evidence.

Low-confidence classification requests clarification or a governed diagnostic step. Controlled exploration is limited to low-risk objectives with a nearby validated alternative and remains a recommendation requiring the same governed execution and evaluation standards.

Composite objectives produce a proposed component plan, with component dependencies made explicit. Escalation is diagnosis-led and stops at human intervention after repeated or safety-critical failure. The outcome contract requires immediate, novel-application, retention, and calibration evidence where applicable, preventing selection from gaming only easy or short-term measures.

## Failure and override handling

Failure-driven reselection is diagnosis-led: prerequisite, transfer, retention, calibration, engagement, and invalid-evaluation failures map to different remedies. Human overrides retain the chosen strategy, reason, and expected outcome for later Phase 39 comparison. Neither overrides nor reselections execute automatically.

## Validation

`tests/unit/learning-constitution/phase40StrategySelectionEngine.test.ts` verifies that weak evidence is excluded before high-risk ranking, selection records retain replay inputs and no execution authority, low-confidence objectives request clarification, and reselection follows a specific diagnosed failure.

The protected API first records an objective profile at `POST /api/learning/strategy-selection`. A separate `POST /api/learning/strategy-selection/select` command retrieves only active registry strategies and contextual Phase 39 evaluation evidence, writes an immutable recommendation, and explicitly does not create a plan or execution lease.

`POST /api/learning/strategy-selection/propose-plan` converts only a recommended selection into an approval-bound Curriculum Planner handoff. The record declares required outcome dimensions but cannot create the Phase 26 approval or Phase 28 execution lease it needs to run.

`POST /api/learning/strategy-selection/approve-plan` is the explicit human-only bridge. It requires complete selection, objective, and knowledge-gap lineage, persists the existing Phase 26 opportunity/proposal/approval sequence, then issues the matching bounded Phase 28 lease. It still does not execute learning.

The curriculum materializer requires that approved bridge and exact active lease, resolves only active, versioned prerequisite edges from the Skill Graph, and delegates ordering and proposed-unit construction to the existing Phase 27 Curriculum Planner. It produces no execution authority.

`POST /api/learning/strategy-selection/materialize-curriculum` resolves canonical Skill Registry and Skill Graph projections server-side; it rejects absent selection, bridge, lease, registry, or graph lineage and persists the resulting non-executing curriculum with its Phase 40 materialization record.

`POST /api/learning/strategy-selection/record-outcome` accepts only a matching Phase 39 evaluation for the selected strategy, objective, and materialized curriculum. It preserves metric evidence and explicitly marks incomplete or invalid outcome records instead of allowing short-term proxy success to influence future selection.

`POST /api/learning/strategy-selection/reselect` first diagnoses the immutable outcome. Invalid evidence requires human review; failed prerequisites, poor retention, poor transfer, and poor calibration produce different advisory reselection remedies. It cannot switch an active plan or lease.

`POST /api/learning/strategy-selection/override` records a human-selected, active alternate strategy with both rationale and expected outcome. The override is an auditable comparison input, not an approval or execution shortcut.

`GET /api/learning/strategy-selection/comparison-analytics?selectionId=…` compares complete, valid system and human-override outcomes for one objective profile. It reports sample size and evidence confidence and is permanently labeled `OBSERVED_ASSOCIATION`, never causal proof or policy mutation authority.

`tests/unit/learning-constitution/phase40Acceptance.test.ts` covers the governed end-to-end loop: evidence-gated selection, human approval and lease issuance, prerequisite-safe curriculum materialization, outcome recording, diagnosis-led reselection, human override comparison, and the invariant that neither selection nor analytics grants execution authority.
