import { describe, expect, it } from "vitest";
import { InMemoryAuthorityLedger, LedgerBackedAuthorityPromotionService } from "../../../services/learning-constitution";
import type { AuthorityPromotionRequest, AuthorityRecord } from "../../../types/learning-constitution";

const record = (authorityType: AuthorityRecord["authorityType"]): AuthorityRecord => ({ authorityId: "authority-1", authorityType, authoritySource: "run:1", sourceIdentity: "agent:noesis", scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: [], constraints: [], provenance: { observationId: "observation-1", sourceId: "run:1", sourceType: "AGENT_OUTPUT", originatingActorId: "agent:noesis", observedAt: "2026-08-23T00:00:00.000Z" } });
const request = (overrides: Partial<AuthorityPromotionRequest> = {}): AuthorityPromotionRequest => ({ eventId: "promotion-1", record: record("AGENT_HYPOTHESIS"), newAuthority: "AGENT_INFERRED", authorizedBy: "governance:reviewer", reason: "evidence confirmed", timestamp: "2026-08-23T00:00:00.000Z", evidenceIds: ["evidence-1"], ...overrides });

describe("Phase 6 authority promotion", () => {
  it("records evidence-backed agent promotions explicitly", async () => {
    const ledger = new InMemoryAuthorityLedger();
    const result = await new LedgerBackedAuthorityPromotionService(ledger).promote(request());
    expect(result).toMatchObject({ status: "APPROVED", reasonCode: "AGENT_PROMOTION_APPROVED", event: { previousAuthority: "AGENT_HYPOTHESIS", newAuthority: "AGENT_INFERRED" } });
    expect(await ledger.findByAuthorityId("authority-1")).toMatchObject([{ eventType: "PROMOTION_APPROVED" }]);
  });
  it("rejects every agent-to-human authority promotion and audits the attempt", async () => {
    const ledger = new InMemoryAuthorityLedger();
    const result = await new LedgerBackedAuthorityPromotionService(ledger).promote(request({ newAuthority: "HUMAN_PREFERENCE" }));
    expect(result).toMatchObject({ status: "REJECTED", reasonCode: "HUMAN_AUTHORITY_REQUIRES_HUMAN_ESTABLISHMENT" });
    expect(await ledger.findAll()).toMatchObject([{ eventType: "PROMOTION_REJECTED" }]);
  });
  it("requires an explicit authorizer and evidence even for an allowed agent sequence", async () => {
    const service = new LedgerBackedAuthorityPromotionService(new InMemoryAuthorityLedger());
    await expect(service.promote(request({ authorizedBy: "" }))).resolves.toMatchObject({ reasonCode: "PROMOTION_AUTHORIZER_REQUIRED" });
    await expect(service.promote(request({ eventId: "promotion-2", evidenceIds: [] }))).resolves.toMatchObject({ reasonCode: "PROMOTION_EVIDENCE_REQUIRED" });
  });
});
