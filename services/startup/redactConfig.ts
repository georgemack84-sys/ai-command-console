import { isSensitiveKey, redactSecretValue } from "./secretRedaction";

export function redactConfig(config: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? redactSecretValue(value) : value,
    ]),
  );
}
