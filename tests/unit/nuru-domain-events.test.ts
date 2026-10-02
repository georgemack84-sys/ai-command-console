import { describe, expect, it, vi } from "vitest";
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
import { NuruEventBus } from "@/src/server/services/nuru-domain-events";
describe("Nuru domain events", () => { it("fans a typed event to subscribers", async () => { const bus = new NuruEventBus(); const subscriber = vi.fn(); bus.subscribe(subscriber); const event = await bus.publish({ type: "KnowledgeDiscovered", actor: "nuru.discovery.v1", resourceId: "K-1", correlationId: "corr-1" }); expect(event.type).toBe("KnowledgeDiscovered"); expect(subscriber).toHaveBeenCalledWith(event); }); });
