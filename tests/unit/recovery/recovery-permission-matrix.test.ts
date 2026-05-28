import { describe, expect, it } from "vitest";

import { getRequiredRecoveryPermission } from "../../../services/recovery/governance/recoveryPermissionMatrix";

describe("recovery permission matrix", () => {
  it("maps replay to recovery:replay", () => {
    expect(getRequiredRecoveryPermission("replay")).toBe("recovery:replay");
  });

  it("maps quarantine to recovery:quarantine", () => {
    expect(getRequiredRecoveryPermission("quarantine")).toBe("recovery:quarantine");
  });
});
