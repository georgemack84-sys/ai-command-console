import { EdgeBookError } from "../errors";
import { EDGEBOOK_PHASE_1_0, type PhaseId } from "../types";

export interface EdgeBookConfig {
  environment: "development" | "test" | "production";
  appName: "EdgeBook";
  phase: PhaseId;
  intelligenceEnabled: boolean;
  recommendationsEnabled: boolean;
  gamblingAdviceEnabled: boolean;
  eventLoggingEnabled: boolean;
  validationStrictMode: boolean;
}

export const defaultEdgeBookConfig: EdgeBookConfig = Object.freeze({
  environment: "development",
  appName: "EdgeBook",
  phase: EDGEBOOK_PHASE_1_0,
  intelligenceEnabled: false,
  recommendationsEnabled: false,
  gamblingAdviceEnabled: false,
  eventLoggingEnabled: true,
  validationStrictMode: true,
});

export function createEdgeBookConfig(overrides: Partial<EdgeBookConfig> = {}): EdgeBookConfig {
  const config: EdgeBookConfig = Object.freeze({
    ...defaultEdgeBookConfig,
    ...overrides,
  });

  assertPhaseSafeConfig(config);
  return config;
}

export function assertPhaseSafeConfig(config: EdgeBookConfig): void {
  if (config.phase !== EDGEBOOK_PHASE_1_0) {
    throw new EdgeBookError("CONFIG_INVALID", "Phase 1.0 config only accepts phase 1.0.", "phase");
  }

  if (config.intelligenceEnabled || config.recommendationsEnabled || config.gamblingAdviceEnabled) {
    throw new EdgeBookError(
      "CONFIG_INVALID",
      "Phase 1.0 fails closed when intelligence, recommendations, or gambling advice flags are enabled.",
    );
  }
}
