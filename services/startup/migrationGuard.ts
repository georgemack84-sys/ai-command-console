import { assessMigrationReadiness } from "./migrationReadiness";

export async function guardMigrationReadiness(input: Parameters<typeof assessMigrationReadiness>[0]) {
  return assessMigrationReadiness(input);
}
