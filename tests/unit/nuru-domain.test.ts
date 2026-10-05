import { describe, expect, it } from "vitest";
import { knowledgeItemSchema, relationshipSchema } from "@/src/nuru/domain";

describe("Nuru domain contracts", () => {
  it("requires source provenance and constrains knowledge state", () => {
    const result = knowledgeItemSchema.safeParse({ id: "K-101", title: "Boundary", content: "Services enforce.", contentType: "Architectural Principle", source: { sourceType: "HUMAN_INPUT", origin: "Owner", authority: "OWNER" }, createdAt: new Date().toISOString(), status: "READY_FOR_REVIEW", confidence: 0.9, provenance: { source: { sourceType: "HUMAN_INPUT", origin: "Owner", authority: "OWNER" }, submittedBy: "owner" }, relationships: [], metadata: {} });
    expect(result.success).toBe(true);
  });

  it("prevents incompatible relationship types", () => {
    expect(relationshipSchema.safeParse({ targetItemId: "K-1", relationshipType: "INVENTED", confidence: 0.7, evidence: "text", proposedBy: "nuru.connection.v1", status: "PROPOSED" }).success).toBe(false);
  });
});
