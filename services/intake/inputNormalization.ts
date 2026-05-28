import type { IntakeSafetyInspection } from "@/types/intent/IntakeSafetyInspection";
import { INTAKE_MAX_PAYLOAD_BYTES, INTAKE_MAX_RECURSION_DEPTH } from "./intakePolicies";
import { stableSerializeEvidence } from "@/services/audit/evidenceHashing";

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
}

function containsBinaryFragment(value: string) {
  return /[\u0001-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

function detectShellContent(value: string) {
  return /\b(?:rm\s+-rf|sudo\b|bash\s+-c|sh\s+-c|cmd\s*\/c|powershell\b|pwsh\b|curl\s+.+\||wget\s+.+\|)\b/i.test(value);
}

function detectScriptContent(value: string) {
  return /<script\b|javascript:|node\s+-e|python\s+-c|@'\s*$|function\s*\(|=>\s*{|process\.|eval\(/im.test(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeValue(value: unknown, depth = 0): unknown {
  if (depth > INTAKE_MAX_RECURSION_DEPTH) {
    throw new Error("intake_recursion_limit_exceeded");
  }
  if (typeof value === "string") {
    return normalizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry, depth + 1));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeValue(entry, depth + 1)]),
    );
  }
  return value;
}

function detectRecursion(value: unknown, depth = 0): boolean {
  if (depth > INTAKE_MAX_RECURSION_DEPTH) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => detectRecursion(entry, depth + 1));
  }
  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => detectRecursion(entry, depth + 1));
  }
  return false;
}

export function inspectIntakeSafety(rawInput: unknown): IntakeSafetyInspection {
  const serialized = stableSerializeEvidence(rawInput);
  const rawString = typeof rawInput === "string" ? rawInput : "";
  const containsBinaryData =
    rawInput instanceof Uint8Array
    || rawInput instanceof ArrayBuffer
    || containsBinaryFragment(rawString)
    || containsBinaryFragment(serialized);

  return {
    containsShellContent: detectShellContent(serialized),
    containsScriptContent: detectScriptContent(serialized),
    containsBinaryData,
    containsRecursivePayload: detectRecursion(rawInput),
    exceedsLimits: Buffer.byteLength(serialized, "utf8") > INTAKE_MAX_PAYLOAD_BYTES,
    malformedEncoding: containsBinaryData,
  };
}

export function normalizeInput(rawInput: unknown) {
  const inspection = inspectIntakeSafety(rawInput);
  if (inspection.containsRecursivePayload) {
    throw new Error("intake_recursion_limit_exceeded");
  }
  const normalized = normalizeValue(rawInput);

  if (typeof normalized === "string") {
    return {
      normalizedInput: {
        text: normalized,
      },
      inspection,
    };
  }

  if (isPlainObject(normalized)) {
    return {
      normalizedInput: {
        structuredPayload: normalized,
      },
      inspection,
    };
  }

  return {
    normalizedInput: {
      text: stableSerializeEvidence(normalized),
    },
    inspection,
  };
}
