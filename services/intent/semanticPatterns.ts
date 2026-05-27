export const ACTION_ALIASES: Record<string, string[]> = {
  inspect: ["inspect", "check", "review", "look at", "show", "status", "diagnose"],
  list: ["list", "enumerate", "display"],
  read: ["read", "open", "cat", "print"],
  search: ["search", "find", "locate", "grep"],
  recover: ["recover", "restore", "rebuild"],
  freeze: ["freeze", "lock", "halt"],
  validate: ["validate", "verify", "confirm"],
};

export const TARGET_ALIASES: Record<string, string[]> = {
  filesystem: ["file", "files", "folder", "directory", "repo", "logs", "log"],
  network: ["network", "port", "socket", "endpoint", "dns"],
  runtime: ["runtime", "service", "process", "server"],
  diagnostics: ["diagnostics", "health", "status", "trace"],
  governance: ["governance", "policy", "approval", "freeze"],
  recovery: ["recovery", "restore", "replay", "backup"],
  security: ["security", "auth", "token", "permission"],
  system: ["system", "machine", "host"],
};

export const DANGEROUS_PATTERNS = [
  /\b(delete|destroy|drop|format|wipe|shutdown|disable|remove)\b/i,
  /\b(execute|run|launch|start)\b.*\b(shell|script|command|powershell|bash)\b/i,
  /<script\b|javascript:|eval\(/i,
  /\bignore previous|bypass governance|self authorize|override approval\b/i,
];

export const AMBIGUOUS_PATTERNS = [
  /\b(it|that|there|something|stuff)\b/i,
  /\b(and|or)\b.*\b(and|or)\b/i,
];

export const PATH_PATTERN = /(?:[A-Za-z]:\\|\/)?[A-Za-z0-9_\-./\\]+\.[A-Za-z0-9]+/;
export const PORT_PATTERN = /\bport\s+(\d{2,5})\b/i;
