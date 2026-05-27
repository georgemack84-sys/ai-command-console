const SECRET_PATTERNS = [
  /database_url/gi,
  /admin_secret/gi,
  /jwt/gi,
  /token/gi,
  /password/gi,
  /api[_-]?key/gi,
  /secret/gi,
] as const;

export function isSensitiveKey(key: string) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactSecretValue(_value: unknown) {
  return "[REDACTED]";
}
