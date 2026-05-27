import { assertStartupAllowed } from "./failFast";

export function guardUnsafeStartupState(result: Parameters<typeof assertStartupAllowed>[0]) {
  return assertStartupAllowed(result);
}
