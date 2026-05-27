import type {
  HumanCoordinationOverrideError,
  OperatorAuthorizationSnapshot,
} from "@/types/human-coordination-override";

function error(
  code: HumanCoordinationOverrideError["code"],
  message: string,
  path?: string,
): HumanCoordinationOverrideError {
  return Object.freeze({ code, message, path });
}

export function validateOverrideAuthorization(
  operator: OperatorAuthorizationSnapshot,
): readonly HumanCoordinationOverrideError[] {
  const errors: HumanCoordinationOverrideError[] = [];
  if (!operator.authenticated) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_UNAUTHORIZED",
      "Override authority requires an authenticated operator.",
      "operator.authenticated",
    ));
  }
  if (!operator.governanceAuthorized) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_UNAUTHORIZED",
      "Override authority requires governance authorization.",
      "operator.governanceAuthorized",
    ));
  }
  if (operator.roles.length === 0) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_UNAUTHORIZED",
      "Override authority requires an explicit operator role set.",
      "operator.roles",
    ));
  }
  return Object.freeze(errors);
}
