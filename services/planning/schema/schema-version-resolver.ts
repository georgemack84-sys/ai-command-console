import { getSchemaByVersion, getCurrentCanonicalSchema } from "./schema-registry";
import { getCompatibleSchemaVersions } from "./compatibility-matrix";

export type SchemaVersionResolution = {
  supported: boolean;
  version: string;
  resolvedVersion?: string;
  deprecated: boolean;
  reason?: "unsupported_version";
};

function parseSemver(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function resolveSchemaVersion(version: string): SchemaVersionResolution {
  const requested = parseSemver(version);
  const current = parseSemver(getCurrentCanonicalSchema().version);

  if (!requested || !current) {
    return {
      supported: false,
      version,
      deprecated: false,
      reason: "unsupported_version",
    };
  }

  const direct = getSchemaByVersion(version);
  if (direct) {
    return {
      supported: true,
      version,
      resolvedVersion: direct.version,
      deprecated: direct.deprecated,
    };
  }

  if (requested.major !== current.major) {
    return {
      supported: false,
      version,
      deprecated: false,
      reason: "unsupported_version",
    };
  }

  const currentEntry = getCurrentCanonicalSchema();
  if (getCompatibleSchemaVersions(currentEntry.version).includes(version)) {
    return {
      supported: true,
      version,
      resolvedVersion: version,
      deprecated: true,
    };
  }

  return {
    supported: false,
    version,
    deprecated: false,
    reason: "unsupported_version",
  };
}
