import { canonicalizeGovernanceBindingToString } from "./governanceBindingCanonicalizer";
import type {
  GovernanceBindingAuditRecord,
  GovernanceLineageEvent,
  GovernanceSnapshot,
  ProposalGovernanceBinding,
} from "./governanceBindingTypes";

export function serializeProposalGovernanceBinding(value: ProposalGovernanceBinding): string {
  return canonicalizeGovernanceBindingToString(value);
}

export function serializeGovernanceSnapshot(value: GovernanceSnapshot): string {
  return canonicalizeGovernanceBindingToString(value);
}

export function serializeGovernanceLineageEvent(value: GovernanceLineageEvent): string {
  return canonicalizeGovernanceBindingToString(value);
}

export function serializeGovernanceBindingAuditRecord(value: GovernanceBindingAuditRecord): string {
  return canonicalizeGovernanceBindingToString(value);
}
