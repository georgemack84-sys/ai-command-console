import { describe, expect, it, vi } from "vitest";

const { record } = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record } }));
import { NuruAgentCollaborationProtocol } from "@/src/server/services/nuru-agent-collaboration-protocol";

describe("Nuru Agent Collaboration Protocol", () => {
  it("allows only the Curator to dispatch the prescribed workflow sequence", async () => {
    const result = await NuruAgentCollaborationProtocol.dispatch({ coordinator: "nuru.curator.v1", workflow: "STANDARD", sequence: 1, specialist: "DISCOVERY", resourceId: "K-1", correlationId: "corr-1" }, async () => ({ status: "success" }));
    expect(result).toEqual({ status: "success" });
    expect(record).toHaveBeenCalledTimes(2);
    expect(record.mock.calls[0][0]).toMatchObject({ operation: "AGENT_DISPATCHED", actor: "nuru.curator.v1" });
  });

  it("rejects peer dispatches and out-of-order specialist calls", () => {
    expect(() => NuruAgentCollaborationProtocol.assertDispatch({ coordinator: "nuru.discovery.v1", workflow: "STANDARD", sequence: 2, specialist: "CONTEXT", resourceId: "K-1", correlationId: "corr-1" })).toThrow();
    expect(() => NuruAgentCollaborationProtocol.assertDispatch({ coordinator: "nuru.curator.v1", workflow: "FAST", sequence: 1, specialist: "QUALITY", resourceId: "K-1", correlationId: "corr-1" })).toThrow(/expected DISCOVERY/);
  });
});
