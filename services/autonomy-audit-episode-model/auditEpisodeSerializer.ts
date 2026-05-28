import { normalizeAuditEpisodeValue } from "./auditEpisodeNormalizer";

export function serializeAuditEpisodeValue(value: unknown): string {
  return JSON.stringify(normalizeAuditEpisodeValue(value));
}
