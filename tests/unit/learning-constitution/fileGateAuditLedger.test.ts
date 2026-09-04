import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FileGateAuditLedger } from "@/services/learning-constitution";
import type { GateAuditEvent } from "@/types/learning-constitution";

const event = (eventId: string): GateAuditEvent => ({
  eventId,
  eventType: "DURABLE_LEARNING_GATE_EVALUATED",
  occurredAt: "2026-08-31T00:00:00.000Z",
  decision: {
    evaluationId: `evaluation:${eventId}`,
    candidateId: "candidate-1",
    outcome: "DEFER",
    reasonCodes: ["INTENT_NOT_ESTABLISHED"],
    checks: [],
    inputFingerprint: "fingerprint",
    context: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8", registryVersion: "1", learningIntent: "UNKNOWN", decisionActorId: "user:owner" },
    authorityEffect: "UNCHANGED",
    executionPermissionGranted: false,
  },
});

describe("FileGateAuditLedger", () => {
  it("persists an append-only audit chain across ledger instances", async () => {
    const directory = await mkdtemp(join(tmpdir(), "noesis-gate-ledger-"));
    const path = join(directory, "gate-audit.jsonl");
    try {
      const first = new FileGateAuditLedger(path);
      await first.append(event("event-1"));
      await first.append(event("event-2"));

      const recovered = new FileGateAuditLedger(path);
      expect(await recovered.verifyIntegrity()).toBe(true);
      expect(await recovered.findByCandidateId("candidate-1")).toHaveLength(2);
      await expect(recovered.append(event("event-2"))).resolves.toMatchObject({ eventId: "event-2" });
      expect(await recovered.findByCandidateId("candidate-1")).toHaveLength(2);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("detects tampering and refuses a subsequent append", async () => {
    const directory = await mkdtemp(join(tmpdir(), "noesis-gate-ledger-"));
    const path = join(directory, "gate-audit.jsonl");
    try {
      const ledger = new FileGateAuditLedger(path);
      await ledger.append(event("event-1"));
      await writeFile(path, `${JSON.stringify({ sequence: 1, previousHash: null, eventHash: "forged", event: event("event-1") })}\n`, "utf8");

      expect(await new FileGateAuditLedger(path).verifyIntegrity()).toBe(false);
      await expect(new FileGateAuditLedger(path).append(event("event-2"))).rejects.toThrow("integrity violation");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
