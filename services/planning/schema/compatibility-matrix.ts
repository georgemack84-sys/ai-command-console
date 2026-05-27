const compatibilityMatrix = new Map<string, readonly string[]>([
  ["1.0.0", ["1.0.0"]],
  ["1.0.1", ["1.0.1"]],
  ["1.1.0", ["1.1.0", "1.0.1", "1.0.0"]],
]);

export function getCompatibleSchemaVersions(version: string) {
  return compatibilityMatrix.get(version) ?? [];
}

