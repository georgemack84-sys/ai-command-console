import { hashFailurePayload, type FailureOrchestrationInput, type FailureOrchestrationResult } from "@/services/failure-orchestration";
import type { ForensicTimeline, ForensicTimelineEntry } from "./enforcementHarnessTypes";

export function buildForensicTimeline(
  scenarioId: string,
  input: FailureOrchestrationInput,
  result: FailureOrchestrationResult,
): ForensicTimeline {
  const entries: ForensicTimelineEntry[] = [
    {
      step: 0,
      phase: "input",
      label: "trusted snapshot and runtime inputs captured",
      hash: hashFailurePayload("EVIDENCE_BUNDLE", {
        registryHash: input.snapshot.manifest.registrySnapshotHash,
        trustedSnapshot: input.trustedSnapshotAdmission.ok,
        zoneAllowed: input.zoneAdmission.allowed,
        runtimeAllowed: input.runtimeValidation.allowed,
      }),
    },
    ...result.signals.map((signal, index) => ({
      step: index + 1,
      phase: "signal" as const,
      label: `${signal.domain}:${signal.type}`,
      hash: hashFailurePayload("EVIDENCE_BUNDLE", signal),
    })),
    ...result.propagation.containment.map((directive, index) => ({
      step: result.signals.length + index + 1,
      phase: "containment" as const,
      label: `${directive.domain}:${directive.action}`,
      hash: hashFailurePayload("EVIDENCE_BUNDLE", directive),
    })),
    {
      step: result.signals.length + result.propagation.containment.length + 1,
      phase: "snapshot",
      label: "immutable failure snapshot captured",
      hash: result.snapshot.snapshotHash,
    },
    {
      step: result.signals.length + result.propagation.containment.length + 2,
      phase: "recovery",
      label: `recovery:${result.recovery.fromMode}->${result.recovery.toMode}`,
      hash: result.recovery.decisionHash,
    },
    {
      step: result.signals.length + result.propagation.containment.length + 3,
      phase: "decision",
      label: `decision:${result.allowed ? "allowed" : "denied"}`,
      hash: result.decisionHash,
    },
  ];

  return {
    scenarioId,
    entries,
    timelineHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      scenarioId,
      entries,
    }),
  };
}
