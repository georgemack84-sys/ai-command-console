import type { OverrideEvent } from "./overrideEvent";

export type OverrideAuthority = Readonly<{
  operatorId: string;
  operatorRole: string;
  targetType: OverrideEvent["targetType"];
  overrideType: OverrideEvent["overrideType"];
  valid: boolean;
  canReduceAuthority: true;
  canElevateAuthority: false;
  canMutateRuntime: false;
  reason: string;
  authorityHash: string;
}>;
