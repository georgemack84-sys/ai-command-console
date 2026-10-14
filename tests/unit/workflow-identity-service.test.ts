import { describe, expect, it } from "vitest";
import { immutableWorkflowSnapshot, workflowIdentitySchema, workflowRunSnapshot } from "@/src/server/services/workflow-identity-service";

describe("workflow identity foundation", () => {
  it("accepts a workspace-safe definition identity but rejects lifecycle or authority fields", () => {
    expect(workflowIdentitySchema.parse({ slug: "nuru-headline-flow", displayName: "Nuru to Headline", description: "Produces a governed headline handoff." })).toMatchObject({ slug: "nuru-headline-flow" });
    expect(() => workflowIdentitySchema.parse({ slug: "nuru-headline-flow", displayName: "Nuru to Headline", description: "Produces a governed headline handoff.", executionAuthorized: true })).toThrow();
  });

  it("hashes an immutable definition independently of object key order", () => {
    const left = immutableWorkflowSnapshot({ contractVersion: "1.0", definition: { steps: [{ key: "collect", settings: { timeout: 30, mode: "READ" } }], name: "Headline flow" } });
    const right = immutableWorkflowSnapshot({ contractVersion: "1.0", definition: { name: "Headline flow", steps: [{ settings: { mode: "READ", timeout: 30 }, key: "collect" }] } });
    expect(left.definitionHash).toBe(right.definitionHash);
    expect(left.definitionSnapshot).toEqual(right.definitionSnapshot);
  });

  it("creates a run snapshot only when it exactly matches the published version", () => {
    const version = immutableWorkflowSnapshot({ contractVersion: "1.0", definition: { name: "Nuru handoff", steps: [] } });
    expect(workflowRunSnapshot({ versionId: "version_1", ...version })).toMatchObject({ workflowVersionId: "version_1", definitionHash: version.definitionHash });
    expect(() => workflowRunSnapshot({ versionId: "version_1", ...version, definitionSnapshot: { name: "changed", steps: [] } })).toThrow("hash mismatch");
  });

  it("rejects non-JSON values from a persisted workflow contract", () => {
    expect(() => immutableWorkflowSnapshot({ contractVersion: "1.0", definition: { createdAt: new Date() } })).toThrow();
  });
});
