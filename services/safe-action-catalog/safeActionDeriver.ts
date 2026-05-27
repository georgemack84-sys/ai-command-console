import type { SafeActionCatalogInput, SafeActionEvidenceLinks, SafeActionProfile } from "@/types/safe-action-catalog";
import { getSafeActionDefinition } from "./safeActionRegistry";
import { validateSafeActionDefinition } from "./safeActionSchemas";
import { classifySafeActionRisk } from "./safeActionRiskClassifier";
import { bindSafeActionGovernance } from "./safeActionGovernanceBinder";
import { bindSafeActionReplay } from "./safeActionReplayBinder";
import { validateSafeActionScope } from "./safeActionScopeValidator";
import { hashSafeActionValue } from "./safeActionHasher";
import { validateSafeActionProfile } from "./safeActionValidator";

export function deriveSafeActionProfile(input: SafeActionCatalogInput): SafeActionProfile {
  const definition = getSafeActionDefinition(input.actionId);
  const riskClass = definition ? classifySafeActionRisk(definition.category) : "forbidden";
  const governanceBinding = bindSafeActionGovernance(input.readinessProfile);
  const replayBinding = definition
    ? bindSafeActionReplay(input.readinessProfile, definition)
    : Object.freeze({
        ...input.readinessProfile.replayBinding,
        required: true,
        valid: false,
        actionSchemaHash: "",
        readinessHash: input.readinessProfile.readinessHash,
        snapshotLineageHash: "",
      });
  const scope = definition ? validateSafeActionScope(input.readinessProfile, definition) : undefined;

  const schemaErrors = definition ? validateSafeActionDefinition(definition) : [];
  const errors = [
    ...schemaErrors,
    ...validateSafeActionProfile({
      readinessProfile: input.readinessProfile,
      definition,
      riskClass,
      scope,
      governanceBinding,
      replayBinding,
      metadata: input.metadata,
    }),
  ];

  const evidence: SafeActionEvidenceLinks = Object.freeze({
    readinessProfileId: input.readinessProfile.profileId,
    readinessHash: input.readinessProfile.readinessHash,
    governanceHash: input.readinessProfile.governanceBinding.governanceDecisionHash,
    replayHash: input.readinessProfile.replayBinding.reconstructionHash,
    snapshotLineageHash: hashSafeActionValue(
      "safe-action-snapshot-lineage",
      input.readinessProfile.snapshotLineageHashes,
    ),
    disputes: input.readinessProfile.disputes,
  });

  const profileId = hashSafeActionValue("safe-action-profile-id", {
    actionId: input.actionId,
    readinessHash: input.readinessProfile.readinessHash,
  });
  const safeActionHash = hashSafeActionValue("safe-action-profile", {
    profileId,
    definition,
    riskClass,
    scope,
    governanceBinding,
    replayBinding,
    evidence,
    metadata: input.metadata ?? {},
    errors,
  });

  return Object.freeze({
    profileId,
    definition:
      definition ??
      Object.freeze({
        id: input.actionId,
        version: "4.5B",
        category: "observe",
        allowedAutonomyLevels: Object.freeze(["A0", "A1", "A2"] as const),
        futureBoundLevels: Object.freeze(["A3", "A4", "A5"] as const),
        forbiddenLevels: Object.freeze(["A6"] as const),
        mutating: false,
        executionAllowed: false,
        selfApprovalAllowed: false,
        policyMutationAllowed: false,
        requiresGovernanceBinding: true,
        requiresReplayBinding: true,
        requiresAudit: true,
      }),
    riskClass,
    scope:
      scope ??
      Object.freeze({
        state: "denied",
        currentLevel: input.readinessProfile.autonomyLevel,
        readinessState: input.readinessProfile.derivedState,
        allowedNow: false,
        futureBound: false,
        withinAuthorityCeiling: false,
        snapshotLineageHashes: Object.freeze([...input.readinessProfile.snapshotLineageHashes]),
        reasons: Object.freeze(["Undefined action capabilities fail closed."]),
      }),
    governanceBinding,
    replayBinding,
    evidence,
    warnings: Object.freeze(
      input.readinessProfile.warnings.concat(
        riskClass === "forbidden" ? ["Forbidden safe action risk classification."] : [],
      ),
    ),
    errors: Object.freeze(errors),
    safeActionHash,
  });
}
