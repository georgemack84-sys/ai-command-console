import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DeferredCandidateReviewQueueService, FileDeferredCandidateRegistry } from "@/services/learning-constitution";
import type { DeferredCandidateRecord } from "@/types/learning-constitution";

const record = (status: DeferredCandidateRecord["status"] = "PENDING"): DeferredCandidateRecord => ({
  deferredCandidateId: "deferred:candidate-1", candidateId: "candidate-1", lastEvaluationId: "evaluation-1", reasonCodes: ["VALIDATION_INCOMPLETE"], status, createdAt: "2026-08-31T00:00:00.000Z", updatedAt: "2026-08-31T00:00:00.000Z",
});

describe("FileDeferredCandidateRegistry", () => {
  it("persists queue history while deriving only current pending records for review", async () => {
    const directory = await mkdtemp(join(tmpdir(), "noesis-deferred-"));
    const path = join(directory, "deferred.jsonl");
    try {
      const registry = new FileDeferredCandidateRegistry(path);
      await registry.upsert(record());
      await registry.upsert({ ...record("COMMITTED"), lastEvaluationId: "evaluation-2", updatedAt: "2026-08-31T00:01:00.000Z" });
      await registry.upsert({ ...record(), deferredCandidateId: "deferred:candidate-2", candidateId: "candidate-2" });

      const recovered = new FileDeferredCandidateRegistry(path);
      expect(await recovered.verifyIntegrity()).toBe(true);
      expect(await recovered.list("PENDING")).toMatchObject([{ candidateId: "candidate-2" }]);
      await expect(new DeferredCandidateReviewQueueService(recovered).listPending()).resolves.toEqual([expect.objectContaining({ candidateId: "candidate-2", blockingReasons: ["VALIDATION_INCOMPLETE"] })]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
