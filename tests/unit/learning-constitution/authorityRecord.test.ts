import { describe, expect, it } from "vitest";
import { validateAuthorityRecord } from "../../../services/learning-constitution";
import type { AuthorityRecord } from "../../../types/learning-constitution";

const record = (overrides: Partial<AuthorityRecord> = {}): AuthorityRecord => ({
  authorityId: "authority-1",
  authorityType: "HUMAN_DECISION",
  authoritySource: "conversation:message-12",
  sourceIdentity: "user:georg",
  scope: { type: "PROJECT", id: "axiom" },
  establishedAt: "2026-08-23T00:00:00.000Z",
  effectiveFrom: "2026-08-23T00:00:00.000Z",
  supersedes: [],
  constraints: ["project:axiom"],
  provenance: {
    observationId: "observation-1",
    sourceId: "conversation:message-12",
    sourceType: "CONVERSATION",
    originatingActorId: "user:georg",
    observedAt: "2026-08-23T00:00:00.000Z",
  },
  ...overrides,
});

describe("Phase 6 authority record", () => {
  it("captures authority metadata separately from provenance", () => {
    const authority = record({ supersedes: ["authority-prior"], delegatedFrom: "authority-delegator" });

    expect(() => validateAuthorityRecord(authority)).not.toThrow();
    expect(authority.authoritySource).toBe("conversation:message-12");
    expect(authority.provenance.observationId).toBe("observation-1");
  });

  it("requires approval lineage for approved authorities", () => {
    expect(() => validateAuthorityRecord(record({ authorityType: "APPROVED_POLICY" }))).toThrow(/approver and approval record/);
    expect(() => validateAuthorityRecord(record({ authorityType: "APPROVED_POLICY", approvedBy: "governance:board", approvalRecord: "approval-1" }))).not.toThrow();
  });

  it("fails closed for invalid scope, temporal bounds, or missing provenance", () => {
    expect(() => validateAuthorityRecord(record({ scope: { type: "PROJECT", id: "" } }))).toThrow(/scope requires an identity/);
    expect(() => validateAuthorityRecord(record({ effectiveUntil: "2026-08-22T00:00:00.000Z" }))).toThrow(/effectiveUntil/);
    expect(() => validateAuthorityRecord(record({ provenance: { ...record().provenance, sourceId: "" } }))).toThrow(/provenance/);
  });
});
