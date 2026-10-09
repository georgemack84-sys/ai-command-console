import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { executeLegacyConsoleRequestFromRouter } = require("../../services/legacyConsoleHandler");
const runtimeControl = require("../../services/runtimeControl");
const toolRouter = require("../../services/toolRouter");

describe("governed legacy console routing", () => {
  it("preserves the nested legacy request risk category", () => {
    expect(runtimeControl.classifyStep({
      type: "single",
      action: "legacy-console:shell_read:help",
    })).toEqual(expect.objectContaining({
      category: "shell_read",
      actionClass: "read",
    }));
  });

  it("rejects compatibility dispatch without the reviewed lane source", async () => {
    await expect(executeLegacyConsoleRequestFromRouter({
      source: "untrusted_caller",
      payload: { body: { command: "help" }, options: {} },
      meta: {},
    })).resolves.toEqual({
      ok: false,
      error: "Legacy console dispatch requires compatibility-lane authority.",
    });
  });

  it("rejects direct router dispatch without reviewed control authority", async () => {
    const result = await toolRouter.route({
      type: "single",
      action: "legacy-console:shell_read:help",
      payload: { body: { command: "help" }, options: {} },
      source: "legacy_console_compat",
      meta: {},
    });

    expect(result).toEqual(expect.objectContaining({
      ok: false,
      error: expect.stringMatching(/reviewed|reviewstatus|control approval/i),
    }));
  });
});
