import { describe, expect, it } from "vitest";
import { groupPaletteItems, rankPaletteItems, saveTerminalView, type PaletteItem } from "@/src/components/terminal-phase2";

describe("terminal phase 2 helpers", () => {
  const items: PaletteItem[] = [
    { key: "command:agent-status", label: "agent:status", value: "agent:status researcher", meta: "command" },
    { key: "macro:alerts", label: "Investigate alerts", value: "alerts:list", meta: "macro" },
    { key: "session:ops", label: "Ops Session", value: "digest:health", meta: "session" },
  ];

  it("ranks fuzzy palette matches ahead of loose matches", () => {
    const ranked = rankPaletteItems(items, "agtst");

    expect(ranked[0]?.label).toBe("agent:status");
  });

  it("groups ranked palette items by section", () => {
    const grouped = groupPaletteItems(items);

    expect(grouped.map((group) => group.title)).toEqual(["Macros", "Sessions", "Commands"]);
  });

  it("saves named views and replaces duplicates by name", () => {
    const created = saveTerminalView(
      [],
      "Morning Queue",
      { queue: "queued", review: "pending", alert: "unacknowledged", schedule: "errors" },
      () => "view_1",
      "2026-04-16T12:00:00.000Z",
    );
    const updated = saveTerminalView(
      created,
      "Morning Queue",
      { queue: "completed", review: "approved", alert: "acknowledged", schedule: "enabled" },
      () => "view_2",
      "2026-04-16T12:05:00.000Z",
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: "view_2",
      filters: {
        queue: "completed",
        review: "approved",
        alert: "acknowledged",
        schedule: "enabled",
      },
    });
  });
});
