import { beforeEach, describe, expect, it, vi } from "vitest";
const getSessionUserMock = vi.hoisted(() => vi.fn()); const requireWorkspaceManagerMock = vi.hoisted(() => vi.fn());
vi.mock("@/src/lib/auth", () => ({ getSessionUser: getSessionUserMock }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: requireWorkspaceManagerMock }));
import { POST as profile } from "@/app/api/learning/strategy-selection/route";
import { POST as select } from "@/app/api/learning/strategy-selection/select/route";
import { POST as propose } from "@/app/api/learning/strategy-selection/propose-plan/route";
import { POST as approve } from "@/app/api/learning/strategy-selection/approve-plan/route";
import { POST as materialize } from "@/app/api/learning/strategy-selection/materialize-curriculum/route";
import { POST as outcome } from "@/app/api/learning/strategy-selection/record-outcome/route";
import { POST as reselect } from "@/app/api/learning/strategy-selection/reselect/route";
import { POST as override } from "@/app/api/learning/strategy-selection/override/route";
import { GET as comparison } from "@/app/api/learning/strategy-selection/comparison-analytics/route";
const json = (body: unknown) => new Request("http://localhost/api/learning/strategy-selection", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
describe("Phase 40 protected API boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); getSessionUserMock.mockResolvedValue(null); });
  it("rejects every write and analytics operation without a session before reading request state", async () => {
    const posts = [profile, select, propose, approve, materialize, outcome, reselect, override];
    for (const handler of posts) expect((await handler(json({}))).status).toBe(401);
    expect((await comparison(new Request("http://localhost/api/learning/strategy-selection/comparison-analytics?selectionId=SEL"))).status).toBe(401);
    expect(requireWorkspaceManagerMock).not.toHaveBeenCalled();
  });
  it("validates objective-profile input after workspace authorization and before persistence", async () => {
    getSessionUserMock.mockResolvedValue({ id: "user-1", workspaceId: "workspace-1", role: "MANAGER" }); requireWorkspaceManagerMock.mockResolvedValue(undefined);
    const response = await profile(json({ objectiveId: "LO", domain: "Security", primaryType: "DIAGNOSTIC", typeConfidence: 2, secondaryTypes: [], currentMastery: "COMPETENT", targetMastery: "ADVANCED", risk: "HIGH", transferRequirement: "HIGH", retentionRequirement: "HIGH" }));
    expect(response.status).toBe(400); expect(requireWorkspaceManagerMock).toHaveBeenCalledWith({ userId: "user-1", userRole: "MANAGER", workspaceId: "workspace-1" });
  });
});
