import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createValidationRequest,
  orchestrateValidation,
  type ValidationContext,
  type ValidationIntakeInput,
} from "@/services/validation-core";
import {
  buildExecutionTreatyFixture,
  verifyExecutionTreatyFixture,
} from "@/tests/execution-treaty/helpers";

export function buildValidationFixture(
  overrides: Partial<ValidationIntakeInput> = {},
) {
  const { treaty } = buildExecutionTreatyFixture();
  const intake: ValidationIntakeInput = {
    targetType: "execution-treaty",
    submittedAt: "2026-05-16T13:00:00.000Z",
    treaty,
    ...overrides,
  };
  const request = createValidationRequest(intake);
  const context: ValidationContext = {
    request,
    treaty: intake.treaty,
  };

  return {
    intake,
    request,
    context,
    output: orchestrateValidation(context),
  };
}

export function buildQuarantinedValidationFixture() {
  const treaty = buildExecutionTreatyFixture().treaty;
  return buildValidationFixture({
    treaty: {
      ...treaty,
      manifest: {
        ...treaty.manifest,
        handoffStatus: "quarantined",
        preExecutionRevocationStatus: "quarantined",
      },
    },
  });
}

export function buildRevalidationValidationFixture() {
  const base = buildExecutionTreatyFixture();
  const treaty = buildExecutionTreatyFixture({
    readiness: {
      ...base.input.readiness,
      certified: false,
      status: "requires_recertification",
    },
    productionCertification: {
      ...base.input.productionCertification,
      certificationStatus: "requires_recertification",
    },
    productionEvidence: {
      ...base.input.productionEvidence,
      revocationStatus: "requires_recertification",
    },
  }).treaty;
  return buildValidationFixture({
    treaty,
  });
}

export function loadValidationCoreSources() {
  const root = path.resolve("services", "validation-core");
  return [
    "validationTypes.ts",
    "validationCoreHasher.ts",
    "validationIntake.ts",
    "validatorUtils.ts",
    "schemaValidator.ts",
    "dependencyValidator.ts",
    "capabilityValidator.ts",
    "governanceValidator.ts",
    "replayValidator.ts",
    "rollbackValidator.ts",
    "runtimeValidator.ts",
    "isolationValidator.ts",
    "integrityValidator.ts",
    "validationEventEmitter.ts",
    "validationTruthLedger.ts",
    "validationEventIntegrity.ts",
    "validationTimelineBuilder.ts",
    "validationCausalityResolver.ts",
    "validationStateReconstructor.ts",
    "validationForensicsEngine.ts",
    "validationReplayTimeline.ts",
    "validationOrchestrator.ts",
    "index.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}

export { verifyExecutionTreatyFixture };
