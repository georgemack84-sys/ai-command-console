export function normalizeAuditEpisodeValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, entry) => entry === undefined ? null : entry)) as T;
}
