import { canonicalizeGovernanceBindingToString } from "./governanceBindingCanonicalizer";
import { hashGovernanceBindingValue } from "./governanceBindingHasher";
import {
  serializeGovernanceBindingAuditRecord,
  serializeGovernanceLineageEvent,
  serializeGovernanceSnapshot,
  serializeProposalGovernanceBinding,
} from "./governanceBindingSerializer";
import type {
  GovernanceBindingAuditRecord,
  GovernanceLineageEvent,
  GovernanceSnapshot,
  ProposalGovernanceBinding,
  ProposalGovernanceBindingError,
} from "./governanceBindingTypes";

export function validateGovernanceBindingDeterminism(input: {
  binding: ProposalGovernanceBinding;
  snapshot: GovernanceSnapshot;
  lineageEvents: readonly GovernanceLineageEvent[];
  auditRecords: readonly GovernanceBindingAuditRecord[];
}): readonly ProposalGovernanceBindingError[] {
  const stable =
    serializeProposalGovernanceBinding(input.binding) === canonicalizeGovernanceBindingToString(input.binding)
    && serializeGovernanceSnapshot(input.snapshot) === canonicalizeGovernanceBindingToString(input.snapshot)
    && input.lineageEvents.every((event) => serializeGovernanceLineageEvent(event) === canonicalizeGovernanceBindingToString(event))
    && input.auditRecords.every((record) => serializeGovernanceBindingAuditRecord(record) === canonicalizeGovernanceBindingToString(record));

  if (!stable) {
    return Object.freeze([{
      code: "PROPOSAL_GOVERNANCE_BINDING_HASH_MISMATCH",
      message: "Governance binding serialization drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  const hashA = hashGovernanceBindingValue("proposal-governance-binding-determinism", canonicalizeGovernanceBindingToString(input));
  const hashB = hashGovernanceBindingValue(
    "proposal-governance-binding-determinism",
    canonicalizeGovernanceBindingToString(JSON.parse(canonicalizeGovernanceBindingToString(input))),
  );
  if (hashA !== hashB) {
    return Object.freeze([{
      code: "PROPOSAL_GOVERNANCE_BINDING_HASH_MISMATCH",
      message: "Governance binding hashing drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  return Object.freeze([]);
}
