import type {
  OverrideAuthority,
  OverrideContractError,
  OverrideEvent,
} from "@/types/human-override-contract";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { hashOverrideValue } from "./overrideHasher";

const ALLOWED_TYPES = new Set<OverrideEvent["overrideType"]>([
  "pause",
  "resume",
  "deny",
  "revoke",
  "escalate",
  "freeze",
  "kill_switch",
]);

export function validateOverrideAuthority(input: {
  event: OverrideEvent;
  governanceView: ConstitutionalGovernanceView;
}): { authority: OverrideAuthority; errors: readonly OverrideContractError[] } {
  const valid =
    ALLOWED_TYPES.has(input.event.overrideType)
    && input.governanceView.policy.unknownAuthorityDisposition === "DENY"
    && input.governanceView.autonomyBoundary.deniedOperations.includes("self-authorize")
    && input.event.operatorRole.trim().length > 0;

  const authority: OverrideAuthority = Object.freeze({
    operatorId: input.event.operatorId,
    operatorRole: input.event.operatorRole,
    targetType: input.event.targetType,
    overrideType: input.event.overrideType,
    valid,
    canReduceAuthority: true,
    canElevateAuthority: false,
    canMutateRuntime: false,
    reason: valid
      ? "Override authority is limited to append-only constitutional evidence."
      : "Override authority is invalid or incomplete.",
    authorityHash: hashOverrideValue("override-authority", {
      operatorId: input.event.operatorId,
      operatorRole: input.event.operatorRole,
      overrideType: input.event.overrideType,
      targetType: input.event.targetType,
      governanceHash: input.governanceView.constitutionalDecisionHash,
    }),
  });

  const errors: OverrideContractError[] = [];
  if (!valid) {
    errors.push({
      code: "OVERRIDE_AUTHORITY_INVALID",
      message: "Override authority is invalid.",
      path: "operatorRole",
    });
  }
  if (input.event.overrideType === "escalate" && input.event.targetType === "global" && input.governanceView.state !== "ALLOW") {
    errors.push({
      code: "OVERRIDE_ESCALATION_INVALID",
      message: "Global escalation requires undisputed governance state.",
      path: "targetType",
    });
  }

  return {
    authority,
    errors: Object.freeze(errors),
  };
}
