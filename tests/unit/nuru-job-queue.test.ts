import { describe, expect, it, vi } from "vitest";
import { NuruJobQueue } from "@/src/server/services/nuru-job-queue";
describe("Nuru background job queue", () => { it("runs deterministic service workers without agent capability", async () => { const queue = new NuruJobQueue(); const worker = vi.fn(async () => undefined); queue.register("EMBEDDING_GENERATION", worker); queue.enqueue({ type: "EMBEDDING_GENERATION", resourceId: "K-1", payload: {} }); const job = await queue.processNext(); expect(job?.status).toBe("COMPLETED"); expect(worker).toHaveBeenCalledOnce(); }); });
