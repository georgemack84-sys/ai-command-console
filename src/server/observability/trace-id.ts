export function createTraceId(prefix = "trace") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
