import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), run: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruCurationSubmissionReceipt: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.update } } })); vi.mock("@/src/server/services/nuru-curation-pipeline", () => ({ NuruCurationPipeline: { run: mocks.run } }));
import { NuruCurationSubmissionService } from "@/src/server/services/nuru-curation-submission-service";
const input = { title: "Recovery boundary", content: "A durable submission receipt must preserve a validated payload for governed recovery.", source: { sourceType: "HUMAN_INPUT" as const, origin: "Owner", authority: "OWNER" as const }, idempotencyKey: "00000000-0000-4000-8000-000000000001" }; const receipt = { id: "receipt-1", actorId: "admin-1", idempotencyKey: input.idempotencyKey, status: "REQUIRES_RECOVERY", request: input, correlationId: "nuru-submission:receipt-1", proposalId: null, queueId: null, result: {}, error: "Interrupted", createdAt: new Date(), updatedAt: new Date() };
describe("Nuru curation submission receipt", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists the validated request and receipt-bound correlation before running the pipeline", async () => { mocks.create.mockResolvedValue({ ...receipt, status: "PROCESSING" }); mocks.run.mockResolvedValue({ status: "HUMAN_REVIEW_REQUIRED", proposal: { id: "proposal-1" }, queue: { id: "queue-1" } }); mocks.update.mockResolvedValue({ ...receipt, status: "COMPLETE", proposalId: "proposal-1", queueId: "queue-1" }); const result = await NuruCurationSubmissionService.submit(input, "admin-1"); expect(result).toMatchObject({ replayed: false, receipt: { status: "COMPLETE", proposalId: "proposal-1" } }); expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({ submissionReceiptId: "receipt-1", correlationId: "nuru-submission:receipt-1" })); });

  it("allows the submitting governor to inspect and resume the same receipt", async () => { mocks.findUnique.mockResolvedValue(receipt); mocks.update.mockResolvedValueOnce({ ...receipt, status: "PROCESSING", error: null }).mockResolvedValueOnce({ ...receipt, status: "COMPLETE", proposalId: "proposal-1", queueId: "queue-1", error: null }); mocks.run.mockResolvedValue({ status: "HUMAN_REVIEW_REQUIRED", proposal: { id: "proposal-1" }, queue: { id: "queue-1" } }); await expect(NuruCurationSubmissionService.inspect("receipt-1", "admin-1")).resolves.toMatchObject({ receipt: { status: "REQUIRES_RECOVERY", canResumeAutomatically: true }, request: input }); await expect(NuruCurationSubmissionService.recover("receipt-1", "admin-1")).resolves.toMatchObject({ recovered: true, receipt: { status: "COMPLETE", proposalId: "proposal-1" } }); expect(mocks.run).toHaveBeenLastCalledWith(expect.objectContaining({ submissionReceiptId: "receipt-1", correlationId: "nuru-submission:receipt-1" })); await expect(NuruCurationSubmissionService.inspect("receipt-1", "admin-2")).rejects.toMatchObject({ status: 403 }); });

  it("recovers an interrupted post-claim run through the original receipt", async () => {
    let stored = { ...receipt, status: "PROCESSING", error: null, result: null as unknown };
    mocks.create.mockImplementation(async ({ data }: { data: typeof stored }) => stored = { ...stored, ...data });
    mocks.findUnique.mockImplementation(async () => stored);
    mocks.update.mockImplementation(async ({ data }: { data: Partial<typeof stored> }) => stored = { ...stored, ...data });
    mocks.run.mockRejectedValueOnce(new Error("Injected post-claim interruption")).mockResolvedValueOnce({ status: "HUMAN_REVIEW_REQUIRED", proposal: { id: "proposal-1" }, queue: { id: "queue-1" } });

    const initial = await NuruCurationSubmissionService.submit(input, "admin-1");
    const claimedCorrelationId = stored.correlationId;
    expect(initial).toMatchObject({ replayed: false, result: null, receipt: { status: "REQUIRES_RECOVERY", error: "Injected post-claim interruption" } });
    await expect(NuruCurationSubmissionService.inspect("receipt-1", "admin-1")).resolves.toMatchObject({ receipt: { status: "REQUIRES_RECOVERY", canResumeAutomatically: true, correlationId: claimedCorrelationId }, request: input });

    await expect(NuruCurationSubmissionService.recover("receipt-1", "admin-1")).resolves.toMatchObject({ recovered: true, receipt: { status: "COMPLETE", proposalId: "proposal-1", queueId: "queue-1" } });
    expect(mocks.run).toHaveBeenNthCalledWith(1, expect.objectContaining({ submissionReceiptId: "receipt-1", correlationId: claimedCorrelationId }));
    expect(mocks.run).toHaveBeenNthCalledWith(2, expect.objectContaining({ submissionReceiptId: "receipt-1", correlationId: claimedCorrelationId }));
  });
});
