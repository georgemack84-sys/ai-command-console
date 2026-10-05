import { z } from "zod";

export const nuruJobTypeSchema = z.enum(["EMBEDDING_GENERATION", "REINDEX", "DUPLICATE_SCAN", "RELATIONSHIP_REFRESH", "SOURCE_INTEGRITY_CHECK", "ARCHIVAL_MAINTENANCE"]);
export type NuruJobType = z.infer<typeof nuruJobTypeSchema>;
export const nuruJobSchema = z.object({ id: z.string(), type: nuruJobTypeSchema, resourceId: z.string().min(1), payload: z.record(z.string(), z.unknown()).default({}), status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED"]), createdAt: z.string().datetime(), completedAt: z.string().datetime().optional(), error: z.string().optional() });
export type NuruJob = z.infer<typeof nuruJobSchema>;
type Worker = (job: NuruJob) => Promise<void>;

/** Deterministic service-worker queue. It accepts maintenance work only; it contains no model or agent capability. */
export class NuruJobQueue {
  private readonly jobs = new Map<string, NuruJob>();
  private readonly workers = new Map<NuruJobType, Worker>();
  register(type: NuruJobType, worker: Worker) { this.workers.set(type, worker); }
  enqueue(input: Omit<NuruJob, "id" | "status" | "createdAt">) { const job = nuruJobSchema.parse({ id: crypto.randomUUID(), status: "QUEUED", createdAt: new Date().toISOString(), ...input }); this.jobs.set(job.id, job); return job; }
  async processNext() { const job = [...this.jobs.values()].find((candidate) => candidate.status === "QUEUED"); if (!job) return null; const worker = this.workers.get(job.type); if (!worker) throw new Error(`No worker registered for ${job.type}.`); const running = { ...job, status: "RUNNING" as const }; this.jobs.set(job.id, running); try { await worker(running); const completed = { ...running, status: "COMPLETED" as const, completedAt: new Date().toISOString() }; this.jobs.set(job.id, completed); return completed; } catch (error) { const failed = { ...running, status: "FAILED" as const, error: error instanceof Error ? error.message : "Worker failed." }; this.jobs.set(job.id, failed); return failed; } }
  list() { return [...this.jobs.values()]; }
}
export const nuruJobQueue = new NuruJobQueue();
