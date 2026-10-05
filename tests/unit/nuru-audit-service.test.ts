import { describe, expect, it } from "vitest";
import { nuruAuditInputSchema } from "@/src/server/services/nuru-audit-service";

describe("Nuru Audit Service", () => {
  it("requires the event fields necessary to explain a durable operation", () => {
    const result = nuruAuditInputSchema.safeParse({ operation: "KNOWLEDGE_ARCHIVED", actor: "nuru.governance.v1", resourceId: "K-102", inputReference: "Owner brief", outputReference: "K-102", decision: "APPROVED", reason: "Source is authoritative.", correlationId: "corr-1" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown operations and missing correlation", () => {
    expect(nuruAuditInputSchema.safeParse({ operation: "SILENT_DELETE", actor: "agent", resourceId: "K-1" }).success).toBe(false);
  });

  it("accepts Source Intelligence operations", () => {
    expect(nuruAuditInputSchema.safeParse({ operation: "NSI_SOURCE_REGISTERED", actor: "human:1", resourceId: "NSI-1", correlationId: "corr-2" }).success).toBe(true);
    expect(nuruAuditInputSchema.safeParse({ operation: "NSI_RAW_ARTIFACT_STORED", actor: "human:1", resourceId: "RAW-1", correlationId: "corr-3" }).success).toBe(true);
    expect(nuruAuditInputSchema.safeParse({ operation: "NSI_SOURCE_REVIEWED", actor: "human:1", resourceId: "NSI-1", correlationId: "corr-4" }).success).toBe(true);
  });
});
