import { describe, expect, it } from "vitest";
import { FailClosedAuthorityGate, InMemoryAuthorityLedger } from "../../../services/learning-constitution";
import type { AuthorityGateRequest, AuthorityLedgerEvent, AuthorityRecord } from "../../../types/learning-constitution";

const record = (overrides: Partial<AuthorityRecord> = {}): AuthorityRecord => ({ authorityId: "authority-1", authorityType: "HUMAN_DIRECTIVE", authoritySource: "message:1", sourceIdentity: "user:georg", scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: [], constraints: [], provenance: { observationId: "observation-1", sourceId: "message:1", sourceType: "CONVERSATION", originatingActorId: "user:georg", observedAt: "2026-08-23T00:00:00.000Z" }, ...overrides });
const request = (overrides: Partial<AuthorityGateRequest> = {}): AuthorityGateRequest => ({ resolution: { status: "CANDIDATE_ASSIGNED", reasonCode: "HUMAN_DIRECTIVE_IDENTIFIED", authorityType: "HUMAN_DIRECTIVE", source: { sourceClass: "HUMAN", sourceIdentity: "user:georg", sourceReference: "message:1" }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, authorityRecord: record(), boundary: { outcome: "APPLIES", reasonCode: "EXACT_SCOPE_MATCH", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, conflict: { outcome: "NO_CONFLICT", reasonCode: "KNOWLEDGE_COMPATIBLE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, ...overrides });

describe("Phase 6 authority enforcement", () => {
  it("allows only a complete, in-scope, non-conflicting authority candidate", () => {
    expect(new FailClosedAuthorityGate().evaluate(request())).toMatchObject({ decision: "ALLOW", reasonCode: "AUTHORITY_ACCEPTED", authorityEffect: "UNCHANGED" });
  });
  it("fails closed for ambiguous source, invalid delegation, boundaries, and unresolved conflict", () => {
    const gate = new FailClosedAuthorityGate();
    expect(gate.evaluate(request({ resolution: { ...request().resolution, source: { ...request().resolution.source, sourceIdentity: "" } } }))).toMatchObject({ decision: "DENY", reasonCode: "AMBIGUOUS_SOURCE" });
    expect(gate.evaluate(request({ authorityRecord: record({ delegatedFrom: "authority-parent" }) }))).toMatchObject({ decision: "DENY", reasonCode: "INVALID_DELEGATION" });
    expect(gate.evaluate(request({ boundary: { ...request().boundary!, outcome: "OUT_OF_SCOPE" } }))).toMatchObject({ decision: "DENY", reasonCode: "OUT_OF_SCOPE_AUTHORITY" });
    expect(gate.evaluate(request({ conflict: undefined }))).toMatchObject({ decision: "REVIEW", reasonCode: "UNRESOLVED_CONFLICT" });
  });
  it("records authority events append-only for later explanation", async () => {
    const ledger = new InMemoryAuthorityLedger();
    const event: AuthorityLedgerEvent = { eventId: "event-1", eventType: "AUTHORITY_ASSIGNED", authorityId: "authority-1", occurredAt: "2026-08-23T00:00:00.000Z", reason: "resolved", authorityRecord: record() };
    await ledger.append(event);
    expect(await ledger.findByAuthorityId("authority-1")).toEqual([event]);
    await expect(ledger.append(event)).rejects.toThrow(/already exists/);
    expect(await ledger.findAll()).toEqual([event]);
  });
});
