import { buildAdmissionContext, hashAdmissionContext } from "./admission-context";
import { decideAdmission } from "./admission-decision-engine";
import { deriveAdmissionHash } from "./derived-admission-hasher";
import { buildGovernanceSupervision } from "./governance-supervision";
import { validateAdmissionLineage } from "./admission-lineage-validator";
import { enforceTrustZone } from "./trust-zone-enforcer";
import { evaluateRuntimeReadiness } from "./runtime-readiness";
import type { AdmissionBuildInput, AdmissionReadiness, AdmissionResult } from "./admission-types";

export function buildAdmissionReadiness(input: AdmissionBuildInput): AdmissionReadiness {
  const context = buildAdmissionContext(input);
  const lineage = validateAdmissionLineage(input);
  const runtime = evaluateRuntimeReadiness(input);
  const trustZone = enforceTrustZone(input);
  const decision = decideAdmission({
    buildInput: input,
    lineage,
    runtime,
    trustZone,
  });
  const supervision = buildGovernanceSupervision({
    buildInput: input,
    decision: decision.decision,
  });

  const contextHash = hashAdmissionContext(context);
  const result: AdmissionResult = {
    decision: decision.decision,
    derivedAdmissionHash: deriveAdmissionHash({
      context,
      decision: decision.decision,
      reasons: decision.reasons,
      blocks: decision.blocks,
      warnings: decision.warnings,
    }),
    reasons: decision.reasons,
    blocks: decision.blocks,
    warnings: decision.warnings,
    contextHash,
  };

  return {
    context,
    lineage,
    runtime,
    trustZone,
    supervision,
    result,
  };
}
