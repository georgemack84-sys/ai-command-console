import { appendFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

import type { GateAuditEvent, GateAuditLedger } from "../../types/learning-constitution/durableLearningGate";
import type { GateAuditEventReader } from "../../types/learning-constitution/gateObservability";

type PersistedGateAuditEvent = Readonly<{
  sequence: number;
  previousHash: string | null;
  eventHash: string;
  event: GateAuditEvent;
}>;

const eventHash = (event: GateAuditEvent, sequence: number, previousHash: string | null): string =>
  createHash("sha256")
    .update(JSON.stringify({ sequence, previousHash, event }))
    .digest("hex");

/**
 * A durable, append-only audit adapter. A corrupted history is never repaired
 * in place: callers receive an error and the learning gate fails closed.
 */
export class FileGateAuditLedger implements GateAuditLedger, GateAuditEventReader {
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly path: string) {}

  async append(event: GateAuditEvent): Promise<GateAuditEvent> {
    const operation = this.pending.then(async () => {
      const entries = await this.readEntries();
      const replay = entries.find((entry) => entry.event.eventId === event.eventId);
      if (replay) {
        if (JSON.stringify({ ...replay.event, occurredAt: "" }) !== JSON.stringify({ ...event, occurredAt: "" })) throw new Error("gate audit event id collision");
        return replay.event;
      }
      const previousHash = entries.at(-1)?.eventHash ?? null;
      const entry: PersistedGateAuditEvent = {
        sequence: entries.length + 1,
        previousHash,
        eventHash: eventHash(event, entries.length + 1, previousHash),
        event,
      };
      await mkdir(dirname(this.path), { recursive: true });
      await appendFile(this.path, `${JSON.stringify(entry)}\n`, "utf8");
      return event;
    });
    this.pending = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async findByCandidateId(candidateId: string): Promise<readonly GateAuditEvent[]> {
    return (await this.readEntries())
      .filter((entry) => entry.event.decision.candidateId === candidateId)
      .map((entry) => entry.event);
  }

  async listEvents(): Promise<readonly GateAuditEvent[]> {
    return (await this.readEntries()).map((entry) => entry.event);
  }

  async verifyIntegrity(): Promise<boolean> {
    try {
      await this.readEntries();
      return true;
    } catch {
      return false;
    }
  }

  private async readEntries(): Promise<readonly PersistedGateAuditEvent[]> {
    let contents: string;
    try {
      contents = await readFile(this.path, "utf8");
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const lines = contents.split(/\r?\n/).filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as PersistedGateAuditEvent);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]!;
      const expectedPreviousHash = index === 0 ? null : entries[index - 1]!.eventHash;
      if (
        entry.sequence !== index + 1 ||
        entry.previousHash !== expectedPreviousHash ||
        entry.eventHash !== eventHash(entry.event, entry.sequence, entry.previousHash)
      ) {
        throw new Error("gate audit ledger integrity violation");
      }
    }
    return entries;
  }
}
