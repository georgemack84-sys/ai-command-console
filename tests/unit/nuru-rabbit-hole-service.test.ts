import { describe, expect, it } from "vitest";
import { buildNuruRabbitHole, findNuruRabbitHoleAccess } from "@/src/server/services/nuru-rabbit-hole-service";

const candidate = (id: string, topics: string[]) => ({ id, title: id, type: "article" as const, sourceFamily: `${id}.example`, topics, confidence: 0.8, sourceUrl: `https://${id}.example` });
describe("Nuru Rabbit Hole", () => { it("is bounded, deterministic, and only follows visible topic connections", () => { const root = candidate("root", ["space"]); const hole = buildNuruRabbitHole(root, [candidate("b", ["space", "history"]), candidate("c", ["history"]), candidate("unrelated", ["music"])]); expect(hole.map((node) => node.candidate.id)).toEqual(["root", "b", "c"]); expect(hole[1]?.sharedTopics).toEqual(["space"]); }); });

describe("Nuru Rabbit Hole release qualification", () => {
  it("returns a five-node grounded path when the eligible pool supports one", () => {
    const root = candidate("root", ["exploration"]);
    const hole = buildNuruRabbitHole(root, [
      candidate("maps", ["exploration", "mapping"]),
      candidate("ocean", ["mapping", "ocean"]),
      candidate("navigation", ["ocean", "navigation"]),
      candidate("craft", ["navigation", "craft"]),
      candidate("unrelated", ["celebrity"]),
    ]);

    expect(hole).toHaveLength(5);
    expect(hole.map((node) => node.candidate.id)).toEqual(["root", "maps", "ocean", "navigation", "craft"]);
    expect(hole.slice(1).every((node) => node.parentId && node.sharedTopics.length > 0)).toBe(true);
    expect(buildNuruRabbitHole(root, Array.from({ length: 12 }, (_, index) => candidate(`node-${index}`, ["exploration"]))).length).toBeLessThanOrEqual(8);
  });
});

describe("Nuru Rabbit Hole access", () => {
  it("permits only nodes reached from a shown root and keeps unrelated pool entries unavailable", () => {
    const root = candidate("root", ["space"]); const connected = candidate("connected", ["space"]); const unrelated = candidate("unrelated", ["music"]);
    expect(findNuruRabbitHoleAccess("connected", [root], [root, connected, unrelated])?.node.sharedTopics).toEqual(["space"]);
    expect(findNuruRabbitHoleAccess("unrelated", [root], [root, connected, unrelated])).toBeNull();
  });
});
