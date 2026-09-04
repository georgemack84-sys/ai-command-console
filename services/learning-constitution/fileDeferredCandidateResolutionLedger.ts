import { appendFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

import type { DeferredCandidateResolutionEvent, DeferredCandidateResolutionLedger } from "../../types/learning-constitution/deferredCandidateResolution";

type ResolutionLedgerEntry = Readonly<{
  sequence: number;
  previousHash: string | null;
  entryHash: string;
  event: DeferredCandidateResolutionEvent;
}>;

const hash = (event: DeferredCandidateResolutionEvent, sequence: number, previousHash: string | null): string =>
  createHash("sha256").update(JSON.stringify({ event, sequence, previousHash })).digest("hex");

/** Durable append-only provenance for inputs supplied to deferred-candidate resolution. */
export class FileDeferredCandidateResolutionLedger implements DeferredCandidateResolutionLedger {
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly path: string) {}

  async append(event: DeferredCandidateResolutionEvent): Promise<DeferredCandidateResolutionEvent> {
    const operation = this.pending.then(async () => {
      const entries = await this.readEntries();
      const replay = entries.find((entry) => entry.event.eventId === event.eventId);
      if (replay) {
        if (JSON.stringify(replay.event) !== JSON.stringify(event)) throw new Error("resolution event id collision");
        return replay.event;
      }
      const previousHash = entries.at(-1)?.entryHash ?? null;
      const entry: ResolutionLedgerEntry = { sequence: entries.length + 1, previousHash, entryHash: hash(event, entries.length + 1, previousHash), event };
      await mkdir(dirname(this.path), { recursive: true });
      await appendFile(this.path, `${JSON.stringify(entry)}\n`, "utf8");
      return event;
    });
    this.pending = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async findByCandidateId(candidateId: string): Promise<readonly DeferredCandidateResolutionEvent[]> {
    return (await this.readEntries()).filter((entry) => entry.event.candidateId === candidateId).map((entry) => entry.event);
  }

  async verifyIntegrity(): Promise<boolean> {
    try { await this.readEntries(); return true; } catch { return false; }
  }

  private async readEntries(): Promise<readonly ResolutionLedgerEntry[]> {
    let contents: string;
    try { contents = await readFile(this.path, "utf8"); }
    catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const entries = contents.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as ResolutionLedgerEntry);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]!;
      const previousHash = index === 0 ? null : entries[index - 1]!.entryHash;
      if (entry.sequence !== index + 1 || entry.previousHash !== previousHash || entry.entryHash !== hash(entry.event, entry.sequence, entry.previousHash)) {
        throw new Error("deferred candidate resolution ledger integrity violation");
      }
    }
    return entries;
  }
}
