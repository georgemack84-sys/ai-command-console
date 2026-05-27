import type { ConstitutionalAttackEngineInput, ConstitutionalAttackError } from "@/types/constitutional-attack-engine";

function error(
  code: ConstitutionalAttackError["code"],
  message: string,
  path?: string,
): ConstitutionalAttackError {
  return Object.freeze({ code, message, path });
}

export function validateAttackConsistency(
  input: ConstitutionalAttackEngineInput,
): readonly ConstitutionalAttackError[] {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const errors: ConstitutionalAttackError[] = [];

  if (!input.deterministicSeed.trim()) {
    errors.push(error("ATTACK_SEED_MISSING", "Deterministic seed is required for constitutional attack simulation.", "deterministicSeed"));
  }
  if (serialized.includes("mutatescenario") || serialized.includes("scenariomutation")) {
    errors.push(error("ATTACK_SCENARIO_MUTATION", "Scenario mutation markers are forbidden.", "metadata"));
  }
  if (
    serialized.includes("authorityinheritance")
    || serialized.includes("approvalinheritance")
    || serialized.includes("dynamiccapability")
  ) {
    errors.push(error("ATTACK_AUTHORITY_EXPANSION", "Authority expansion or dynamic capability markers are forbidden.", "metadata"));
  }
  if (
    serialized.includes("recursiveworkflow")
    || serialized.includes("recursivecoordination")
    || serialized.includes("orchestrationdrift")
    || serialized.includes("synthesizetopology")
  ) {
    errors.push(error("ATTACK_ORCHESTRATION_IMPORT", "Recursive orchestration or topology synthesis markers are forbidden.", "metadata"));
  }
  if (serialized.includes("mutatechronology") || serialized.includes("chronologymutation")) {
    errors.push(error("ATTACK_CHRONOLOGY_MUTATION", "Chronology mutation markers are forbidden.", "metadata"));
  }
  if (input.readinessResult.record.failClosed) {
    errors.push(error("ATTACK_FAIL_CLOSED", "Upstream readiness certification was already fail-closed.", "readinessResult.record.failClosed"));
  }

  return Object.freeze(errors);
}
