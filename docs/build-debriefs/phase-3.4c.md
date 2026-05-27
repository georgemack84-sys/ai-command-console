# Build Debrief

Phase: 3.4C
Prompt version: 1
What worked:
- Governance docs were added before feature work.
- Advisory learning was isolated into a dedicated module.
- Learning patterns and approvals were added to the existing SQLite runtime store without creating a second DB layer.
- Runtime control now reads governed learning output and passes advisory context to the planner through memory.
- Existing execution, review, and staged-runtime suites stayed green after integration.
What failed:
- The normal ESLint run still ignores `services/**`, so import-boundary enforcement is not active through the default lint path.
Prompt gap | Codex gap | Architecture gap:
- Prompt gap:
  - The phase required lint import restrictions, but the repo’s existing ignore scope weakens enforcement for CommonJS runtime files.
- Codex gap:
  - The first learning module pass used a staleness threshold that did not match the existing runtime-control contract and had to be corrected.
- Architecture gap:
  - Advisory/learning logic was already embedded inside runtime control before Phase 3.4C, so boundary isolation required partial extraction rather than clean greenfield placement.
What changes next:
- Move more learning-specific helpers out of `runtimeControl.js` into governed modules if the repository continues down this architecture.
- Narrow or restructure ESLint ignore coverage so service-layer boundary rules run in the default lint path.
- Add operator-facing governance surfaces for pattern approval and promotion.
Architecture gaps:
- Default lint coverage still excludes most of `services/**`.
- Learning pattern governance exists in code and persistence, but no operator UI exists yet for approvals.
New safeguards added:
- Advisory interface contract documented.
- Layer boundary rules documented.
- Safety constraints documented.
- Prompt and build debrief artifacts versioned.
- Boundary test added to prevent learning imports from execution/router/planner modules.
- Static import restriction added for `services/learningAdvisory.js` when lint is run in-scope.
- Learning failures now degrade safely and emit `learning.error` audit events.
Remaining risks:
- Static boundary enforcement is still a known gap under the default lint scope.
- Some older learning helper logic remains in `runtimeControl.js` as dormant compatibility code and should be reduced over time.
