import type { CoordinationGovernanceSchema } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ConstitutionalAutonomyReadinessGateRecord } from "./constitutionalAutonomyReadinessGateAdapter";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function buildCoordinationGovernanceSchema(input: {
  governanceView: ConstitutionalGovernanceView;
  readinessGate: ConstitutionalAutonomyReadinessGateRecord;
  createdAt: string;
}): CoordinationGovernanceSchema {
  return Object.freeze({
    schemaId: hashCoordinationGovernanceValue("intent-coordination-governance-schema-id", {
      governanceHash: input.governanceView.policy.policySnapshotHash,
      readinessHash: input.readinessGate.readinessHash,
      createdAt: input.createdAt,
    }),
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
    readinessCertificationId: input.readinessGate.certification.certificationId,
    readinessLevel: input.readinessGate.certification.readinessLevel,
    allowedRelationshipTypes: Object.freeze(["dependency", "reference", "approval", "observation", "escalation"]),
    forbiddenTopologyPatterns: Object.freeze([
      "recursive_coordination",
      "circular_escalation",
      "hidden_dependencies",
      "dynamic_topology_expansion",
      "execution_authority",
    ]),
    executionAuthority: false,
    replaySafe: true,
    createdAt: input.createdAt,
  });
}
