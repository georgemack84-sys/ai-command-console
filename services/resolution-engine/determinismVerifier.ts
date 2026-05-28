import type { ImmutableExecutionBinding } from "./resolutionTypes";

export function verifyDeterministicBindings(bindings: readonly ImmutableExecutionBinding[]): boolean {
  if (!bindings.length) {
    return true;
  }
  const [first, ...rest] = bindings;
  return rest.every((binding) => JSON.stringify(binding) === JSON.stringify(first));
}
