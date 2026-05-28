import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedRunRecoveryVerification = vi.fn();

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryVerificationController.js");
const runnerPath = require.resolve("../../services/recoveryVerificationRunner.js");

function loadController() {
  delete require.cache[controllerPath];
  require.cache[runnerPath] = {
    id: runnerPath,
    filename: runnerPath,
    loaded: true,
    exports: {
      runRecoveryVerification: mockedRunRecoveryVerification,
    },
  } as any;
  return require("../../services/recoveryVerificationController.js");
}

beforeEach(() => {
  mockedRunRecoveryVerification.mockReset();
});

describe("recovery verification controller", () => {
  it("runs verification once through the runner", () => {
    const controller = loadController();
    mockedRunRecoveryVerification.mockReturnValue({
      ok: true,
      data: { evaluated: 1, verified: 1 },
    });

    const result = controller.runVerificationOnce({
      requestedBy: "operator_1",
      limit: 3,
      dryRun: true,
    });

    expect(result).toEqual({
      ok: true,
      data: { evaluated: 1, verified: 1 },
    });
  });
});
