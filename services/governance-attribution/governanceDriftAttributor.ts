import type { GovernanceAttributionInput, GovernanceDriftResult, GovernanceLineageNode, GovernanceProvenanceEvent } from "./governanceTypes";
import { resolveGovernanceAttribution } from "./governanceAttributionResolver";
import { validateGovernanceLineage } from "./governanceLineageGraph";
import { validateGovernanceProvenanceLedger } from "./governanceProvenanceLedger";

export function attributeGovernanceDrift(input: {
  attributionInput: GovernanceAttributionInput;
  previousGovernanceHash: string;
  lineageNodes: readonly GovernanceLineageNode[];
  provenanceEvents: readonly GovernanceProvenanceEvent[];
}): GovernanceDriftResult {
  const current = resolveGovernanceAttribution(input.attributionInput);
  const failures = [...current.failures];

  if (current.governanceHash !== input.previousGovernanceHash && input.lineageNodes.length < 2) {
    failures.push({
      code: "TOOL_GOVERNANCE_DRIFT_DETECTED",
      message: "governance attribution changed without lineage continuity",
    });
  }

  failures.push(...validateGovernanceLineage(input.lineageNodes));
  failures.push(...validateGovernanceProvenanceLedger(input.provenanceEvents));

  return {
    driftDetected: failures.length > 0,
    failures,
  };
}
