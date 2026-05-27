import { hashCertificationValue } from "./certificationHashEngine";

export function buildCertificationStateMachine() {
  const stages = Object.freeze([
    "request",
    "replay_certification",
    "governance_certification",
    "proposal_lineage_certification",
    "approval_replay_certification",
    "transition_visibility_certification",
    "hidden_execution_certification",
    "containment_certification",
    "operator_supremacy_certification",
    "immutable_audit_certification",
    "fail_closed_certification",
    "append_only_evidence_generation",
  ]);
  return Object.freeze({
    stages,
    stateMachineHash: hashCertificationValue("decision-readiness-state-machine", stages),
  });
}
