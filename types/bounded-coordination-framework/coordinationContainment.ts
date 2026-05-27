import type { CoordinationCeiling } from "./coordinationCeiling";

export type CoordinationContainment = Readonly<{
  containmentId: string;
  valid: boolean;
  bounded: boolean;
  isolated: boolean;
  overrideReachable: boolean;
  effectiveCeiling: CoordinationCeiling;
  reasons: readonly string[];
  cautionState: "observe" | "restricted" | "escalated" | "frozen-recommended";
  createdAt: string;
}>;
