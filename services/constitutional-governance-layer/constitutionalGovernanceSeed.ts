import { buildMissionConsoleComposition, type ConsoleCompositionContext } from "@/services/mission-intelligence-console";
import type { AutonomyLevel } from "@/types/deterministic-snapshot-engine";
import type { ConstitutionalGovernanceInput, MissionConsoleGovernanceContext } from "@/types/constitutional-governance";
import type { MissionConsoleView } from "@/types/mission-intelligence-console";

export function buildMissionConsoleGovernanceContext(view: MissionConsoleView): MissionConsoleGovernanceContext {
  return Object.freeze({
    autonomy: Object.freeze({
      autonomyLevel: view.autonomy.autonomyLevel,
    }),
    approvals: Object.freeze({
      data: Object.freeze({
        escalationRoutes: view.approvals.data.escalationRoutes,
      }),
    }),
    recovery: Object.freeze({
      data: Object.freeze({
        readiness: view.recovery.data.readiness,
      }),
    }),
    simulation: Object.freeze({
      data: Object.freeze({
        readOnly: view.simulation.data.readOnly,
        branchOutcomes: view.simulation.data.branchOutcomes,
      }),
    }),
    warnings: view.warnings,
    errors: view.errors,
  });
}

export function buildConstitutionalGovernanceSeedFromComposition(
  composition: ConsoleCompositionContext,
): ConstitutionalGovernanceInput {
  return Object.freeze({
    ...composition.missionSeedContext,
    consoleView: buildMissionConsoleGovernanceContext(composition.missionView),
  });
}

export function buildConstitutionalGovernanceSeed(input?: Readonly<{
  missionId?: string;
  executionId?: string;
  autonomyLevel?: AutonomyLevel;
}>): ConstitutionalGovernanceInput {
  return buildConstitutionalGovernanceSeedFromComposition(buildMissionConsoleComposition(input));
}
