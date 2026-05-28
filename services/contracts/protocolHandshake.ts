export function negotiateProtocolVersion(requestedVersion?: string) {
  if (!requestedVersion || requestedVersion === "v1") {
    return {
      ok: true as const,
      version: "v1",
    };
  }

  return {
    ok: false as const,
    error: "API_VERSION_UNSUPPORTED",
  };
}
