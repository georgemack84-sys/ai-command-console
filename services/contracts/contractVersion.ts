export type ParsedContractVersion = {
  major: number;
  minor: number;
  patch: number;
};

export function parseContractVersion(version: string): ParsedContractVersion {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || "").trim());
  if (!match) {
    throw new Error("API_VERSION_UNSUPPORTED");
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareContractVersions(left: string, right: string) {
  const a = parseContractVersion(left);
  const b = parseContractVersion(right);
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}
