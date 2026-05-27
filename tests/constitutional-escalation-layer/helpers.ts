import { readFileSync } from "node:fs";
import path from "node:path";

import { buildConstitutionalEscalation } from "@/services/constitutional-escalation-layer";
import type { ConstitutionalEscalationInput } from "@/services/constitutional-escalation-layer";
import { buildBoundedCoordinationFixture } from "@/tests/bounded-coordination-framework/helpers";

export function buildConstitutionalEscalationFixture(overrides: Partial<{
  metadata: Readonly<Record<string, unknown>>;
  confidenceScore: number;
  previousConfidenceScore: number;
  currentState: "draft" | "validated" | "governance_review" | "approved" | "denied" | "prepared_handoff" | "archived" | "revoked";
  requestedTransition: "validate" | "submit_governance_review" | "approve" | "deny" | "prepare_handoff" | "archive" | "revoke";
}> = {}) {
  const coordinationFixture = buildBoundedCoordinationFixture(overrides);
  const input: ConstitutionalEscalationInput = Object.freeze({
    monitoringModel: coordinationFixture.auditFixture.input.monitoringModel,
    auditEpisode: coordinationFixture.auditFixture.episode,
    coordinationFramework: coordinationFixture.framework,
    governanceView: coordinationFixture.auditFixture.input.governanceView,
    overrideContract: coordinationFixture.auditFixture.input.overrideContract,
    replay: coordinationFixture.auditFixture.input.replay,
    generatedAt: "2026-05-16T18:03:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    coordinationFixture,
    input,
    escalation: buildConstitutionalEscalation(input),
  };
}

export function loadConstitutionalEscalationSources() {
  const root = path.resolve("services", "constitutional-escalation-layer");
  return [
    "index.ts",
    "constitutionalEscalationEngine.ts",
    "escalationSeverityEngine.ts",
    "oversightRecommendationLayer.ts",
    "constitutionalFreezeRecommendation.ts",
    "escalationReplayBinder.ts",
    "escalationReplayReconstruction.ts",
    "escalationLineageLedger.ts",
    "escalationHasher.ts",
    "escalationSerializer.ts",
    "escalationNormalizer.ts",
    "escalationGuards.ts",
    "escalationSchemas.ts",
    "escalationErrors.ts",
    "escalationEvidenceBinder.ts",
    "escalationTopologyValidator.ts",
    "escalationConfidenceEngine.ts",
    "escalationPolicyValidator.ts",
    "escalationContainmentEvaluator.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
