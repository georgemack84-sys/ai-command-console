import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  nuruTasteProfileSignal: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: repository }));

import { actOnNuruTasteProfileSignal } from "@/src/server/services/nuru-taste-interview-service";

describe("Nuru Taste Map signal actions", () => {
  beforeEach(() => { vi.clearAllMocks(); repository.nuruTasteProfileSignal.findMany.mockResolvedValue([]); });

  it("refuses to mutate a signal owned by someone else", async () => {
    repository.nuruTasteProfileSignal.findUnique.mockResolvedValue({ id: "signal-1", userId: "other-user", concept: "Process", dimension: "ATTENTION_LENS", polarity: 1, confidence: 0.2, evidenceCount: 1, status: "CANDIDATE", isActive: true, updatedAt: new Date() });
    await expect(actOnNuruTasteProfileSignal("current-user", { signalId: "signal-1", type: "confirm" })).rejects.toThrow("no longer exists");
    expect(repository.nuruTasteProfileSignal.update).not.toHaveBeenCalled();
    expect(repository.nuruTasteProfileSignal.deleteMany).not.toHaveBeenCalled();
  });

  it("quiets only the current user's signal and removes it from active results", async () => {
    repository.nuruTasteProfileSignal.findUnique.mockResolvedValue({ id: "signal-1", userId: "current-user", concept: "Process", dimension: "ATTENTION_LENS", polarity: 1, confidence: 0.2, evidenceCount: 1, status: "CANDIDATE", isActive: true, updatedAt: new Date() });
    repository.nuruTasteProfileSignal.update.mockResolvedValue({ id: "signal-1", userId: "current-user", concept: "Process", dimension: "ATTENTION_LENS", polarity: 1, confidence: 0.2, evidenceCount: 1, status: "CANDIDATE", isActive: false, updatedAt: new Date() });
    await expect(actOnNuruTasteProfileSignal("current-user", { signalId: "signal-1", type: "quiet" })).resolves.toEqual([]);
    expect(repository.nuruTasteProfileSignal.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "signal-1" }, data: { isActive: false } }));
  });
});
