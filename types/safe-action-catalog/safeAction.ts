import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { SafeActionDefinition } from "./safeActionRegistry";
import type { SafeActionRiskClass } from "./safeActionRisk";
import type { SafeActionScope } from "./safeActionScope";
import type {
  SafeActionEvidenceLinks,
  SafeActionGovernanceEvidence,
  SafeActionReplayEvidence,
} from "./safeActionEvidence";
import type { SafeActionError } from "./safeActionErrors";

export type SafeActionCatalogInput = Readonly<{
  readinessProfile: AutonomyReadinessProfile;
  actionId: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type SafeActionProfile = Readonly<{
  profileId: string;
  definition: SafeActionDefinition;
  riskClass: SafeActionRiskClass;
  scope: SafeActionScope;
  governanceBinding: SafeActionGovernanceEvidence;
  replayBinding: SafeActionReplayEvidence;
  evidence: SafeActionEvidenceLinks;
  warnings: readonly string[];
  errors: readonly SafeActionError[];
  safeActionHash: string;
}>;
