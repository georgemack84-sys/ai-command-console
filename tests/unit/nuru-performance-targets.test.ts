import { describe, expect, it } from "vitest";
import { NuruPerformanceTargets } from "@/src/server/services/nuru-performance-targets";
describe("Nuru V1 performance targets", () => { it("reports compliance against measurable latency, safety, and audit goals", () => { expect(NuruPerformanceTargets.evaluate({ searchTypicalMs: 300, metadataRetrievalMs: 100, simpleCurationMs: 9_000, complexCurationMs: 40_000, agentSchemaCompliance: .995, auditCoverage: 1, directAgentDatabaseWrites: 0, unauthorizedMutations: 0 }).healthy).toBe(true); }); });
