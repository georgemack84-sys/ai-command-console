import { appendFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

import type { DeferredCandidateRecord, DeferredCandidateRegistry, DeferredCandidateStatus } from "../../types/learning-constitution/deferredCandidateLifecycle";

type DeferredCandidateLedgerEntry = Readonly<{
  sequence: number;
  previousHash: string | null;
  entryHash: string;
  record: DeferredCandidateRecord;
}>;

const hash = (record: DeferredCandidateRecord, sequence: number, previousHash: string | null): string =>
  createHash("sha256").update(JSON.stringify({ record, sequence, previousHash })).digest("hex");

/** Durable, append-only deferred-candidate history with a derived current queue. */
export class FileDeferredCandidateRegistry implements DeferredCandidateRegistry {
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly path: string) {}

  async upsert(record: DeferredCandidateRecord): Promise<DeferredCandidateRecord> {
    const operation = this.pending.then(async () => {
      const entries = await this.readEntries();
      const current = entries.at(-1)?.record.deferredCandidateId === record.deferredCandidateId
        ? entries.at(-1)?.record
        : this.derive(entries).get(record.deferredCandidateId);
      if (current && JSON.stringify(current) === JSON.stringify(record)) return current;
      const previousHash = entries.at(-1)?.entryHash ?? null;
      const entry: DeferredCandidateLedgerEntry = {
        sequence: entries.length + 1,
        previousHash,
        entryHash: hash(record, entries.length + 1, previousHash),
        record,
      };
      await mkdir(dirname(this.path), { recursive: true });
      await appendFile(this.path, `${JSON.stringify(entry)}\n`, "utf8");
      return record;
    });
    this.pending = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async get(deferredCandidateId: string): Promise<DeferredCandidateRecord | undefined> {
    return this.derive(await this.readEntries()).get(deferredCandidateId);
  }

  async list(status?: DeferredCandidateStatus): Promise<readonly DeferredCandidateRecord[]> {
    return [...this.derive(await this.readEntries()).values()]
      .filter((record) => !status || record.status === status)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.deferredCandidateId.localeCompare(right.deferredCandidateId));
  }

  async verifyIntegrity(): Promise<boolean> {
    try { await this.readEntries(); return true; } catch { return false; }
  }

  private derive(entries: readonly DeferredCandidateLedgerEntry[]): Map<string, DeferredCandidateRecord> {
    return new Map(entries.map((entry) => [entry.record.deferredCandidateId, entry.record]));
  }

  private async readEntries(): Promise<readonly DeferredCandidateLedgerEntry[]> {
    let contents: string;
    try { contents = await readFile(this.path, "utf8"); }
    catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const entries = contents.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as DeferredCandidateLedgerEntry);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]!;
      const previousHash = index === 0 ? null : entries[index - 1]!.entryHash;
      if (entry.sequence !== index + 1 || entry.previousHash !== previousHash || entry.entryHash !== hash(entry.record, entry.sequence, entry.previousHash)) {
        throw new Error("deferred candidate ledger integrity violation");
      }
    }
    return entries;
  }
}
