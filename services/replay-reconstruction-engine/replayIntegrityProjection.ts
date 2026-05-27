import { verifyExecutionTreatyIntegrity } from "@/services/execution-treaty";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayIntegrityCheck, ReplayIntegrityView } from "@/types/replay-reconstruction-engine";
import type { ReplayLineageView } from "@/types/replay-reconstruction-engine";

export function projectReplayIntegrity(input: {
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
  lineage: ReplayLineageView;
}): ReplayIntegrityView {
  const treatyIntegrity = verifyExecutionTreatyIntegrity(input.treaty);
  const eventIntegrityValid = input.validation.eventIntegrity.every((record) => record.verified);
  const lineageIntegrityValid = input.lineage.valid;
  const replayHashValid = Boolean(input.treaty.manifest.replaySnapshotHash && input.treaty.manifest.replayBindingHash);

  const checks: ReplayIntegrityCheck[] = [
    Object.freeze({
      check: "treaty-integrity",
      passed: treatyIntegrity.valid,
      expected: input.treaty.hashes.treatyHash,
      actual: treatyIntegrity.valid ? input.treaty.hashes.treatyHash : treatyIntegrity.failures[0]?.code,
    }),
    Object.freeze({
      check: "event-integrity",
      passed: eventIntegrityValid,
    }),
    Object.freeze({
      check: "lineage-integrity",
      passed: lineageIntegrityValid,
    }),
    Object.freeze({
      check: "replay-hash-binding",
      passed: replayHashValid,
      expected: input.treaty.manifest.replayBindingHash,
      actual: input.lineage.replayBindingHash,
    }),
  ];

  return Object.freeze({
    valid: treatyIntegrity.valid && eventIntegrityValid && lineageIntegrityValid && replayHashValid,
    treatyIntegrityValid: treatyIntegrity.valid,
    eventIntegrityValid,
    lineageIntegrityValid,
    replayHashValid,
    checks: Object.freeze(checks),
  });
}
