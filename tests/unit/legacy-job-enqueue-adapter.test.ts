import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const { createLegacyJobEnqueueAdapter } = require("../../services/legacyJobEnqueueAdapter.js");

describe("legacy job enqueue adapter", () => {
  it("normalizes legacy actor identities before durable admission", () => {
    const enqueueAdmittedJob = vi.fn(() => ({ id: "job_1" }));
    const enqueueLegacyJob = createLegacyJobEnqueueAdapter({ enqueueAdmittedJob });

    expect(enqueueLegacyJob("watcher:run", { workspace: "alpha" }, { id: "operator_1", name: "Alex" })).toEqual({ id: "job_1" });
    expect(enqueueAdmittedJob).toHaveBeenCalledWith(
      "watcher:run",
      { workspace: "alpha" },
      expect.objectContaining({ actorId: "operator_1", workspaceId: "alpha", name: "Alex" }),
    );
  });

  it("preserves provenance conflicts for the admitted queue to reject", () => {
    const enqueueAdmittedJob = vi.fn(() => ({ id: "job_1" }));
    const enqueueLegacyJob = createLegacyJobEnqueueAdapter({ enqueueAdmittedJob });

    enqueueLegacyJob("brief:route", { workspace: "alpha" }, { actorId: "operator_1", workspaceId: "beta" });

    expect(enqueueAdmittedJob).toHaveBeenCalledWith(
      "brief:route",
      { workspace: "alpha" },
      expect.objectContaining({ actorId: "operator_1", workspaceId: "beta" }),
    );
  });
});
