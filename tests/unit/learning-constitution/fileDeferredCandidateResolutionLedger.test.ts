import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FileDeferredCandidateResolutionLedger } from "@/services/learning-constitution";
import type { DeferredCandidateResolutionEvent } from "@/types/learning-constitution";

const event = (eventId: string): DeferredCandidateResolutionEvent => ({ eventId, candidateId: "candidate-1", kind: "APPROVAL", actorId: "user:manager", summary: "Approved for re-evaluation.", evidenceRefs: ["approval:1"], occurredAt: "2026-08-31T00:01:00.000Z" });

describe("FileDeferredCandidateResolutionLedger", () => {
  it("persists immutable resolution provenance across instances", async () => {
    const directory = await mkdtemp(join(tmpdir(), "noesis-resolution-"));
    const path = join(directory, "resolutions.jsonl");
    try {
      await new FileDeferredCandidateResolutionLedger(path).append(event("resolution-1"));
      const recovered = new FileDeferredCandidateResolutionLedger(path);
      expect(await recovered.verifyIntegrity()).toBe(true);
      await expect(recovered.findByCandidateId("candidate-1")).resolves.toEqual([event("resolution-1")]);
      await expect(recovered.append({ ...event("resolution-1"), summary: "different" })).rejects.toThrow("id collision");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
