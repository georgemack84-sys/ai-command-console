import type { ConstitutionalAttackEngineInput, ConstitutionalAttackError } from "@/types/constitutional-attack-engine";

function error(
  code: ConstitutionalAttackError["code"],
  message: string,
  path?: string,
): ConstitutionalAttackError {
  return Object.freeze({ code, message, path });
}

export function validateAttackIsolation(
  input: ConstitutionalAttackEngineInput,
): readonly ConstitutionalAttackError[] {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const errors: ConstitutionalAttackError[] = [];

  if (serialized.includes("executionimport") || serialized.includes("execute")) {
    errors.push(error("ATTACK_EXECUTION_IMPORT", "Execution import or execution semantics were detected.", "metadata"));
  }
  if (serialized.includes("orchestrationimport") || serialized.includes("continueworkflow")) {
    errors.push(error("ATTACK_ORCHESTRATION_IMPORT", "Operational orchestration markers were detected.", "metadata"));
  }
  if (serialized.includes("schedulerimport") || serialized.includes("schedule") || serialized.includes("silentretry")) {
    errors.push(error("ATTACK_SCHEDULER_IMPORT", "Scheduler or silent retry markers were detected.", "metadata"));
  }
  if (serialized.includes("mutateruntime") || serialized.includes("runtimewrite")) {
    errors.push(error("ATTACK_RUNTIME_MUTATION", "Runtime mutation markers were detected.", "metadata"));
  }
  if (errors.length > 0) {
    errors.push(error("ATTACK_ISOLATION_VIOLATION", "Attack simulation isolation was violated by operational markers.", "metadata"));
  }

  return Object.freeze(errors);
}
