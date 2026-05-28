import type { AutonomyLevel, AutonomyState } from "./autonomyStates";

export type AuthorityCeiling = Readonly<{
  currentLevel: AutonomyLevel;
  ceilingLevel: AutonomyLevel;
  permittedStates: readonly AutonomyState[];
  deniedCapabilities: readonly string[];
  immutable: true;
  ceilingHash: string;
}>;
