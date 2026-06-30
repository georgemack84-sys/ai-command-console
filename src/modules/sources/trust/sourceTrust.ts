import type { SourceStatus, SourceType, TrustLevel } from "../schemas/sourceRegistryTypes";

export const validSourceTypes: ReadonlySet<SourceType> = new Set(["SPORTSBOOK", "API", "MANUAL_INPUT"]);
export const validTrustLevels: ReadonlySet<TrustLevel> = new Set(["HIGH", "MEDIUM", "LOW", "UNVERIFIED"]);
export const validSourceStatuses: ReadonlySet<SourceStatus> = new Set(["ACTIVE", "DISABLED", "PENDING", "BLOCKED"]);

export function isValidSourceType(value: unknown): value is SourceType {
  return typeof value === "string" && validSourceTypes.has(value as SourceType);
}

export function isValidTrustLevel(value: unknown): value is TrustLevel {
  return typeof value === "string" && validTrustLevels.has(value as TrustLevel);
}

export function isValidSourceStatus(value: unknown): value is SourceStatus {
  return typeof value === "string" && validSourceStatuses.has(value as SourceStatus);
}

export function isSourceStatusObservationEligible(status: SourceStatus): boolean {
  return status === "ACTIVE";
}
