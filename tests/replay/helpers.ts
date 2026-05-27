import { getCanonicalRegistryDocument, getCanonicalRegistryPolicies } from "@/services/registry/toolRegistry";
import { reconstructHistoricalReplay, type HistoricalApprovalState, type ReplayOrchestrationInput } from "@/services/replay";
import { buildRuntimeValidationFixture } from "@/tests/runtime-validation/helpers";
import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import { validateRuntimeEnvironment } from "@/services/runtime-validation";

export function buildReplayFixture(): ReplayOrchestrationInput {
  const runtimeFixture = buildRuntimeValidationFixture();
  const entry = getCanonicalRegistryDocument().tools.find(
    (candidate) => candidate.toolId === runtimeFixture.binding.toolId && candidate.version === runtimeFixture.binding.toolVersion,
  );
  const policy = Object.values(getCanonicalRegistryPolicies()).find(
    (candidate) => candidate.toolId === runtimeFixture.binding.toolId && candidate.version === runtimeFixture.binding.toolVersion,
  );

  if (!entry || !policy) {
    throw new Error("replay fixture registry state missing");
  }

  const approvalState: HistoricalApprovalState = {
      approvalLevel: entry.governanceMetadata.approvalLevel,
      approvers: entry.approvalRequired ? ["operator-1"] : [],
      approvalChainHash: hashStableContent("APPROVAL", {
        approvalLevel: entry.governanceMetadata.approvalLevel,
        approvers: entry.approvalRequired ? ["operator-1"] : [],
        provenanceHash: runtimeFixture.activeRuntime.governance.provenanceHash,
      governanceHash: runtimeFixture.activeRuntime.governance.attribution.governanceHash,
    }),
  };

  return {
    binding: runtimeFixture.binding,
    runtimeValidation: validateRuntimeEnvironment(runtimeFixture),
    runtime: runtimeFixture.activeRuntime.runtime,
    governance: runtimeFixture.activeRuntime.governance,
    registryEntrySnapshot: entry,
    policySnapshot: policy,
    approvalState,
  };
}

export function buildReplayBundle() {
  const fixture = buildReplayFixture();
  return reconstructHistoricalReplay(fixture);
}
