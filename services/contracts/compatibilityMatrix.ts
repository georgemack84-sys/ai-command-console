const matrix = new Map<string, string[]>();

function key(id: string, version: string) {
  return `${id}@${version}`;
}

export function registerCompatibility(id: string, version: string, compatibleWith: string[]) {
  matrix.set(key(id, version), [...compatibleWith]);
}

export function getCompatibleVersions(id: string, version: string) {
  return matrix.get(key(id, version)) || [];
}
