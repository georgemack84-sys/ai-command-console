import { getMigrationTarget } from "./migrationMap";

export function getMigrationAdvice(id: string, version: string) {
  return {
    targetVersion: getMigrationTarget(id, version),
  };
}
