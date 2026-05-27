export function evaluateSchemaCompatibility({
  expectedMigrations,
  appliedMigrations,
}: {
  expectedMigrations: string[];
  appliedMigrations: string[];
}) {
  const pending = expectedMigrations.filter((migration) => !appliedMigrations.includes(migration));
  return {
    compatible: pending.length === 0,
    pending,
  };
}
