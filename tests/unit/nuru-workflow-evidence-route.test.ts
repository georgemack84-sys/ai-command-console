import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admit: vi.fn(), retrieve: vi.fn() }));
vi.mock("@/src/server/services/nuru-governed-invocation-service", () => ({ admitNuruReadInvocation: mocks.admit }));
vi.mock("@/src/server/services/nuru-workflow-evidence-contract-service", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/src/server/services/nuru-workflow-evidence-contract-service")>()), retrieveNuruWorkflowEvidence: mocks.retrieve }));

import { POST } from "@/app/v1/workflow/[operation]/route";
import { AppError } from "@/src/server/api/errors";

const body = { correlationId: "correlation-123", idempotencyKey: "idempotency-123", query: "ocean exploration", resource: "reference-workflow" };
const context = { params: Promise.resolve({ operation: "evidence:retrieve" }) } as RouteContext<"/v1/workflow/[operation]">;

describe("POST /v1/workflow/evidence:retrieve", () => {
  beforeEach(() => { mocks.admit.mockReset(); mocks.retrieve.mockReset(); });

  it("admits the scoped read operation and returns typed evidence", async () => {
    mocks.admit.mockResolvedValue({ workspaceId: "workspace-1", principalId: "principal-1" });
    mocks.retrieve.mockResolvedValue({ evidence: [], audit: { correlationId: body.correlationId }, replayed: false });
    const response = await POST(new Request("https://nuru.test/v1/workflow/evidence:retrieve", { method: "POST", headers: { authorization: "Bearer credential-value", "x-correlation-id": body.correlationId, "idempotency-key": body.idempotencyKey }, body: JSON.stringify(body) }), context);
    expect(response.status).toBe(200);
    expect(mocks.admit).toHaveBeenCalledWith("credential-value", "evidence.retrieve", "reference-workflow");
  });

  it("fails closed before admission when correlation is mismatched", async () => {
    const response = await POST(new Request("https://nuru.test/v1/workflow/evidence:retrieve", { method: "POST", headers: { authorization: "Bearer credential-value", "x-correlation-id": "correlation-other", "idempotency-key": body.idempotencyKey }, body: JSON.stringify(body) }), context);
    expect(response.status).toBe(400);
    expect(mocks.admit).not.toHaveBeenCalled();
  });

  it.each([
    [new AppError(401, "application_credential_invalid", "Credential is invalid."), 401, "application_credential_invalid"],
    [new AppError(401, "application_credential_revoked", "Credential is revoked."), 401, "application_credential_revoked"],
    [new AppError(403, "capability_scope_denied", "Scope is not allowed."), 403, "capability_scope_denied"],
  ])("fails closed for rejected credentials and scopes (%s)", async (rejection, status, code) => {
    mocks.admit.mockRejectedValue(rejection);
    const response = await POST(new Request("https://nuru.test/v1/workflow/evidence:retrieve", { method: "POST", headers: { authorization: "Bearer rejected-credential", "x-correlation-id": body.correlationId, "idempotency-key": body.idempotencyKey }, body: JSON.stringify(body) }), context);
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code } });
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
});
