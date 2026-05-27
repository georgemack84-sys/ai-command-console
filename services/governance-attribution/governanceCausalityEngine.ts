import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { GovernanceCausalityEdge, GovernanceFailure, GovernanceMetadata } from "./governanceTypes";

function buildEdge(from: string, to: string, rationale: string): GovernanceCausalityEdge {
  const edgeHash = hashStableContent("GOVERNANCE", { from, to, rationale });
  return { from, to, rationale, edgeHash };
}

export function buildGovernanceCausalityEdges(metadata: GovernanceMetadata): readonly GovernanceCausalityEdge[] {
  const edges: GovernanceCausalityEdge[] = [];

  if (metadata.dataSensitivity === "restricted" || metadata.dataSensitivity === "regulated") {
    edges.push(buildEdge("Sandbox Escalation", "Risk Escalation", "sensitive data requires stronger containment"));
  }
  if (metadata.riskLevel === "high" || metadata.riskLevel === "critical") {
    edges.push(buildEdge("Risk Escalation", "Approval Escalation", "high risk requires stronger approval"));
  }
  if (metadata.auditLevel === "full" || metadata.auditLevel === "forensic") {
    edges.push(buildEdge("Approval Escalation", "Audit Expansion", "expanded approvals require deeper audit"));
  }
  if (metadata.provenanceLevel === "full" || metadata.provenanceLevel === "forensic") {
    edges.push(buildEdge("Audit Expansion", "Replay Restriction", "forensic provenance requires stronger replay evidence"));
  }

  return edges;
}

export function validateGovernanceCausalityEdges(edges: readonly GovernanceCausalityEdge[]): readonly GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  for (const edge of edges) {
    const expected = buildEdge(edge.from, edge.to, edge.rationale);
    if (expected.edgeHash !== edge.edgeHash) {
      failures.push({
        code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
        message: "governance causality edge hash mismatch",
      });
    }
  }
  return failures;
}
