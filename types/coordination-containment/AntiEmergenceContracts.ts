import type { AntiEmergenceValidationResult, CoordinationContainmentInput } from "./ContainmentContracts";

export type AntiEmergenceValidationInput = Readonly<{
  input: CoordinationContainmentInput;
  hiddenMarkers: readonly string[];
  recursiveMarkers: readonly string[];
  authorityMarkers: readonly string[];
  runtimeMarkers: readonly string[];
  replayErrors: readonly string[];
}>;

export type AntiEmergenceValidator = (input: AntiEmergenceValidationInput) => AntiEmergenceValidationResult;
