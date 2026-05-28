import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import { normalizeDeterministicValue } from "../contracts/deterministicJson";
import { recordObservabilityLogEvent } from "./observabilityTelemetry";
import {
  OBSERVABILITY_LOG_CATEGORIES,
  OBSERVABILITY_LOG_LEVELS,
} from "./observabilityTypes";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { ObservabilityLogCategory, ObservabilityLogLevel, StructuredLogEvent } from "./observabilityTypes";

function defaultNow() {
  return new Date().toISOString();
}

export function createStructuredLogEvent(
  input: {
    level: ObservabilityLogLevel;
    category: ObservabilityLogCategory;
    message: string;
    source: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
    tenantContext?: TenantContext;
  },
  options: {
    now?: () => string;
  } = {},
): StructuredLogEvent {
  if (!OBSERVABILITY_LOG_LEVELS.includes(input.level)) {
    throw new Error("OBSERVABILITY_LOG_LEVEL_INVALID");
  }
  if (!OBSERVABILITY_LOG_CATEGORIES.includes(input.category)) {
    throw new Error("OBSERVABILITY_LOG_CATEGORY_INVALID");
  }

  const timestamp = (options.now || defaultNow)();
  const metadata = normalizeDeterministicValue(input.metadata || {});
  const correlationId = String(input.correlationId || `${input.category}:${input.source}`);

  return {
    eventId: hashPayloadDeterministically({
      timestamp,
      level: input.level,
      category: input.category,
      message: input.message,
      source: input.source,
      correlationId,
      metadata,
    }),
    timestamp,
    level: input.level,
    category: input.category,
    message: input.message,
    source: input.source,
    correlationId,
    tenantId: input.tenantContext?.tenantId,
    workspaceId: input.tenantContext?.workspaceId,
    metadata,
  };
}

export function emitStructuredLogEvent(
  input: Parameters<typeof createStructuredLogEvent>[0],
  options: Parameters<typeof createStructuredLogEvent>[1] = {},
) {
  const event = createStructuredLogEvent(input, options);
  recordObservabilityLogEvent(event);
  return event;
}
