import type { AuditObservation, AutonomyAuditEpisodeError, OperatorInteraction } from "@/types/autonomy-audit-episode-model";
import { createAuditEpisodeError } from "./auditEpisodeErrors";

export function validateAuditObservation(observation: AuditObservation): readonly AutonomyAuditEpisodeError[] {
  const errors: AutonomyAuditEpisodeError[] = [];
  if (!Number.isFinite(observation.confidenceScore) || observation.confidenceScore < 0 || observation.confidenceScore > 1) {
    errors.push(createAuditEpisodeError("AUTONOMY_AUDIT_EPISODE_INVALID", "Observation confidence must remain within 0..1.", "observation.confidenceScore"));
  }
  return Object.freeze(errors);
}

export function validateOperatorInteractions(interactions: readonly OperatorInteraction[]): readonly AutonomyAuditEpisodeError[] {
  const errors: AutonomyAuditEpisodeError[] = [];
  for (const interaction of interactions) {
    if (!interaction.operatorId || !interaction.operatorRole) {
      errors.push(createAuditEpisodeError("AUTONOMY_OPERATOR_LINEAGE_INVALID", "Operator interaction requires stable attribution.", "operatorInteractions"));
      break;
    }
  }
  return Object.freeze(errors);
}
