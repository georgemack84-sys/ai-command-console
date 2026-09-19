import { beforeEach, describe, expect, it } from "vitest";
import { recordAudit } from "./audit-log";

describe("audit log", () => {
  beforeEach(() => window.localStorage.clear());

  it("retains a bounded sequence of recent events", () => {
    for (let index = 0; index < 202; index += 1) {
      recordAudit(`event.${index}`);
    }
    const events = JSON.parse(
      window.localStorage.getItem("axiom-time:audit") ?? "[]",
    ) as { action: string; at: string }[];
    expect(events).toHaveLength(200);
    expect(events[0].action).toBe("event.2");
    expect(Number.isFinite(Date.parse(events[0].at))).toBe(true);
  });

  it("replaces malformed historical audit data", () => {
    window.localStorage.setItem("axiom-time:audit", "not-json");
    recordAudit("alarm.created", "alarm-1");
    expect(
      JSON.parse(window.localStorage.getItem("axiom-time:audit") ?? "[]"),
    ).toMatchObject([{ action: "alarm.created", detail: "alarm-1" }]);
  });
});
