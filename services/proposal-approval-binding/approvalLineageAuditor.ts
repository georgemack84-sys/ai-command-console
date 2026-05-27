import type {
  ApprovalLineage,
  ProposalApprovalBindingError,
} from "./types/proposalApprovalBindingTypes";

export function auditApprovalLineage(
  lineage: ApprovalLineage,
): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];

  if (new Set(lineage.approvalIds).size !== lineage.approvalIds.length) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_MISSING_LINEAGE",
      message: "Approval lineage contains duplicate approval identifiers.",
      path: "lineage.approvalIds",
    });
  }

  if (new Set(lineage.overrideBindingIds).size !== lineage.overrideBindingIds.length) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_OVERRIDE_CORRUPTED",
      message: "Override lineage contains duplicate immutable override bindings.",
      path: "lineage.overrideBindingIds",
    });
  }

  return Object.freeze(errors);
}
