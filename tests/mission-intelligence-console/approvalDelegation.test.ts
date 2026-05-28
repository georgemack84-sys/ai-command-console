import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("approval delegation", () => {
  it("surfaces governed approval routes instead of performing approvals directly", () => {
    const fixture = buildMissionConsoleFixture();
    const approvalAction = fixture.view.operatorActions.find((action) => action.authority === "control-plane.approval");

    expect(approvalAction?.delegated).toBe(true);
    expect(approvalAction?.route).toBe("/api/control-plane/approval");
  });
});
