import { describe, expect, it } from "vitest";

import * as ReviewRoute from "@/app/api/control-plane/review/route";
import * as ApprovalRoute from "@/app/api/control-plane/approval/route";
import * as DisputesRoute from "@/app/api/control-plane/disputes/route";
import * as EvidenceRoute from "@/app/api/control-plane/evidence/route";
import * as SimulationRoute from "@/app/api/control-plane/simulation/route";

describe("no direct execution", () => {
  it("does not expose mutation handlers on control-plane routes", () => {
    expect("POST" in ReviewRoute).toBe(false);
    expect("POST" in ApprovalRoute).toBe(false);
    expect("POST" in DisputesRoute).toBe(false);
    expect("POST" in EvidenceRoute).toBe(false);
    expect("POST" in SimulationRoute).toBe(false);
  });
});
