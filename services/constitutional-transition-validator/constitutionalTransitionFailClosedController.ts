import type { ConstitutionalTransitionError } from "./types/constitutionalTransitionTypes";

export function shouldTransitionFailClosed(errors: readonly ConstitutionalTransitionError[]): boolean {
  return errors.length > 0;
}
