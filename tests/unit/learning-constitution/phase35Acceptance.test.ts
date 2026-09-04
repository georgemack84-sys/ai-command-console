import { describe, expect, it } from "vitest";
import { CapabilityAuthorizationService, CapabilityGrantLifecycleService, CapabilityPreflightAuditService, CapabilityPreflightService, InMemoryLearningAuditLedger, LearningCapabilityBoundaryService } from "@/services/learning-constitution";
import type { CapabilityArtifactRecord, CapabilityArtifactStore, CapabilityRequest } from "@/types/learning-constitution";

const at = "2026-09-03T20:00:00.000Z";
const agent = { actorId: "agent:noesis", actorType: "AGENT" as const };
const owner = { actorId: "human:owner", actorType: "HUMAN" as const };
const store = (): CapabilityArtifactStore => { const records: CapabilityArtifactRecord[] = []; return { append: async (artifact) => { records.push(artifact); return artifact; }, listArtifacts: async (subjectId) => records.filter((artifact) => artifact.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };
const request: CapabilityRequest = { requestId: "CR-ACCEPT-35", actor: agent, capability: "SYSTEM_ADMINISTRATION", operations: ["CHANGE_SERVICE_CONFIGURATION"], resourceId: "environment:production", scope: ["services:noesis"], purpose: "Perform an approved operational change.", relatedTaskId: "TASK-35", supportingCertificationIds: ["SK-SYSTEM_ADMINISTRATION-CERTIFIED", "RETENTION-LONG_TERM", "ADVERSARIAL-PASSED"], requestedDurationMinutes: 30, riskClass: "CRITICAL", constraints: ["approved-change-window"], status: "REQUESTED", createdAt: at, immutable: true, learningEvidenceOnly: true, executionPermissionGranted: false };

describe("Phase 35 integrated acceptance", () => {
  it("blocks extreme competence evidence until separate authority exists, then blocks again after revocation", async () => {
    const artifacts = store(); const ledger = new InMemoryLearningAuditLedger(); const authorization = new CapabilityAuthorizationService(artifacts, ledger); const preflight = new CapabilityPreflightService(); const operation = { actor: agent, capability: request.capability, operation: "CHANGE_SERVICE_CONFIGURATION", resourceId: request.resourceId, scope: "services:noesis", satisfiedConstraints: ["approved-change-window"], requestedAt: at, availableTool: true };
    await authorization.request(request, "workspace-35", "phase35-acceptance");
    const competenceOnly = preflight.check(operation, []);
    expect(competenceOnly).toMatchObject({ authorized: false, reason: "NO_GRANT", executionPermissionGranted: false });
    await new CapabilityPreflightAuditService(ledger).record({ eventId: "AUDIT-BLOCK-35", workspaceId: "workspace-35", request: operation, result: competenceOnly, correlationId: "phase35-acceptance" });
    expect(new LearningCapabilityBoundaryService().rejectAuthorityMutation({ source: "CERTIFICATION", requestedEffect: "CREATE_GRANT" })).toMatchObject({ blocked: true, executionPermissionGranted: false });
    const grant = await authorization.approve({ grantId: "CG-ACCEPT-35", request, grantedBy: owner, grantedAt: at, expiresAt: "2026-09-03T20:30:00.000Z", workspaceId: "workspace-35", correlationId: "phase35-acceptance" });
    expect(preflight.check(operation, [grant])).toMatchObject({ authorized: true, reason: "AUTHORIZED", grantId: grant.grantId, executionPermissionGranted: true });
    const revocation = await new CapabilityGrantLifecycleService(artifacts, ledger).transition({ eventId: "REVOKE-ACCEPT-35", grant, to: "REVOKED", reason: "Owner revoked the operational window.", actor: owner, occurredAt: "2026-09-03T20:10:00.000Z", workspaceId: "workspace-35", correlationId: "phase35-acceptance" });
    expect(preflight.check({ ...operation, requestedAt: "2026-09-03T20:11:00.000Z" }, [grant], [revocation])).toMatchObject({ authorized: false, reason: "REVOKED", executionPermissionGranted: false });
    expect((await ledger.list("workspace-35")).map((entry) => entry.event.eventType)).toEqual(["CAPABILITY_REQUESTED", "CAPABILITY_BLOCKED", "CAPABILITY_APPROVED", "CAPABILITY_REVOKED"]);
  });
});
