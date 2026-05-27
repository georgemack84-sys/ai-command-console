import { hashGovernanceBindingValue } from "./governanceBindingHasher";
import type { GovernanceLineageEvent, ProposalGovernanceBinding } from "./governanceBindingTypes";

export function appendGovernanceLineageEvents(input: {
  existing?: readonly GovernanceLineageEvent[];
  binding: ProposalGovernanceBinding;
  createdAt: string;
}): readonly GovernanceLineageEvent[] {
  const eventTypes: readonly GovernanceLineageEvent["eventType"][] = input.binding.bindingStatus === "BOUND"
    ? Object.freeze([
        "GOVERNANCE_BINDING_CREATED",
        "GOVERNANCE_BINDING_VALIDATED",
        "GOVERNANCE_BINDING_REPLAYED",
      ])
    : input.binding.bindingStatus === "FROZEN"
      ? Object.freeze([
          "GOVERNANCE_BINDING_CREATED",
          "GOVERNANCE_BINDING_VALIDATED",
          "GOVERNANCE_BINDING_FROZEN",
        ])
      : input.binding.bindingStatus === "REVOKED"
        ? Object.freeze([
            "GOVERNANCE_BINDING_CREATED",
            "GOVERNANCE_BINDING_VALIDATED",
            "GOVERNANCE_BINDING_REVOKED",
          ])
        : Object.freeze([
            "GOVERNANCE_BINDING_CREATED",
            "GOVERNANCE_BINDING_DISPUTED",
          ]);

  const start = input.existing ?? [];
  const appended = eventTypes.map((eventType, index) => {
    const previousHash = [...start, ...[]].at(-1)?.eventHash ?? start.at(-1)?.eventHash;
    const base = {
      eventId: `${input.binding.bindingId}:${eventType}:${index + 1}`,
      proposalId: input.binding.proposalId,
      bindingId: input.binding.bindingId,
      eventType,
      governanceSnapshotId: input.binding.governanceSnapshotId,
      policySnapshotId: input.binding.policySnapshotId,
      authorityBoundaryId: input.binding.authorityBoundaryId,
      replayContractId: input.binding.replayContractId,
      validatorVersionSetId: input.binding.validatorVersionSetId,
      previousHash,
      createdAt: input.createdAt,
    };
    return Object.freeze({
      ...base,
      eventHash: hashGovernanceBindingValue("proposal-governance-binding-lineage-event", base),
    });
  });

  return Object.freeze([...start, ...appended]);
}
