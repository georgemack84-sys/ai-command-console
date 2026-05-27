import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedRunRecoveryLearningPass = vi.fn();

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryLearningController.js");
const runnerPath = require.resolve("../../services/recoveryLearningRunner.js");

function loadController() {
  delete require.cache[controllerPath];
  require.cache[runnerPath] = {
    id: runnerPath,
    filename: runnerPath,
    loaded: true,
    exports: {
      runRecoveryLearningPass: mockedRunRecoveryLearningPass,
    },
  } as any;
  return require("../../services/recoveryLearningController.js");
}

beforeEach(() => {
  mockedRunRecoveryLearningPass.mockReset();
});

describe("recovery learning controller", () => {
  it("runs learning once through the runner", () => {
    const controller = loadController();
    mockedRunRecoveryLearningPass.mockReturnValue({
      ok: true,
      data: { recommendations: [] },
    });

    const result = controller.runLearningOnce({
      requestedBy: "operator_1",
      limit: 3,
      dryRun: true,
    });

    expect(result).toEqual({
      ok: true,
      data: { recommendations: [] },
    });
  });
});
