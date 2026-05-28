const migrations = new Map<string, string>();

function key(id: string, version: string) {
  return `${id}@${version}`;
}

export function registerMigrationTarget(id: string, version: string, targetVersion: string) {
  migrations.set(key(id, version), targetVersion);
}

export function getMigrationTarget(id: string, version: string) {
  return migrations.get(key(id, version));
}
