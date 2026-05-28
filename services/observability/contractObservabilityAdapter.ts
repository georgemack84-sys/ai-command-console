import { getCompatibilityAlerts } from "../contracts/compatibilityAlerts";
import { getContractTelemetrySnapshot } from "../contracts/contractTelemetry";
import { getGovernanceAuditEvents } from "../contracts/governanceAudit";
import { getValidationTelemetrySnapshot } from "../contracts/validationTelemetry";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { ObservabilityMetric } from "./metricTypes";
import type { ObservabilitySourceStatus } from "./observabilityTypes";

type ContractAdapterSnapshot = {
  generatedAt: string;
  tenantContext?: TenantContext;
  validationTelemetry?: Record<string, number>;
  contractTelemetry?: Record<string, number>;
  compatibilityAlerts?: string[];
  governanceEvents?: Array<Record<string, unknown>>;
};

function createUnknownMetric({
  name,
  source,
  component,
  generatedAt,
  tenantContext,
}: {
  name: ObservabilityMetric["name"];
  source: string;
  component: ObservabilityMetric["component"];
  generatedAt: string;
  tenantContext?: TenantContext;
}): ObservabilityMetric {
  return {
    name,
    value: null,
    unit: "count",
    status: "UNKNOWN",
    source,
    measuredAt: generatedAt,
    component,
    tenantId: tenantContext?.tenantId,
    workspaceId: tenantContext?.workspaceId,
  };
}

function createCountMetric({
  name,
  source,
  component,
  generatedAt,
  value,
  status,
  tenantContext,
}: {
  name: ObservabilityMetric["name"];
  source: string;
  component: ObservabilityMetric["component"];
  generatedAt: string;
  value: number;
  status?: ObservabilityMetric["status"];
  tenantContext?: TenantContext;
}): ObservabilityMetric {
  return {
    name,
    value,
    unit: "count",
    status: status || (value > 0 ? "WARNING" : "OK"),
    source,
    measuredAt: generatedAt,
    component,
    tenantId: tenantContext?.tenantId,
    workspaceId: tenantContext?.workspaceId,
  };
}

export function buildContractObservabilitySnapshot(input: ContractAdapterSnapshot) {
  const inputKeys = new Set(Object.keys(input));
  const validationTelemetry = inputKeys.has("validationTelemetry")
    ? (input.validationTelemetry || {})
    : getValidationTelemetrySnapshot(input.tenantContext);
  const contractTelemetry = inputKeys.has("contractTelemetry")
    ? (input.contractTelemetry || {})
    : getContractTelemetrySnapshot(input.tenantContext);
  const compatibilityAlerts = inputKeys.has("compatibilityAlerts")
    ? (input.compatibilityAlerts || [])
    : getCompatibilityAlerts(input.tenantContext);
  const governanceEvents = inputKeys.has("governanceEvents")
    ? (input.governanceEvents || [])
    : getGovernanceAuditEvents(input.tenantContext);

  const hasValidationTelemetry = !inputKeys.has("validationTelemetry") || input.validationTelemetry !== undefined;
  const hasContractTelemetry = !inputKeys.has("contractTelemetry") || input.contractTelemetry !== undefined;
  const hasCompatibilityTelemetry = !inputKeys.has("compatibilityAlerts") || input.compatibilityAlerts !== undefined;
  const hasGovernanceTelemetry = !inputKeys.has("governanceEvents") || input.governanceEvents !== undefined;

  const metrics: Record<string, ObservabilityMetric> = {
    contractValidationFailures: hasValidationTelemetry
      ? createCountMetric({
          name: "contractValidationFailures",
          source: "contracts.validation",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: validationTelemetry.validation_failed || 0,
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "contractValidationFailures",
          source: "contracts.validation",
          component: "contracts",
          generatedAt: input.generatedAt,
          tenantContext: input.tenantContext,
        }),
    strictModeRejections: hasValidationTelemetry
      ? createCountMetric({
          name: "strictModeRejections",
          source: "contracts.validation",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: validationTelemetry.strict_mode_rejection || validationTelemetry.validation_failed || 0,
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "strictModeRejections",
          source: "contracts.validation",
          component: "contracts",
          generatedAt: input.generatedAt,
          tenantContext: input.tenantContext,
        }),
    unknownFieldRejections: hasValidationTelemetry
      ? createCountMetric({
          name: "unknownFieldRejections",
          source: "contracts.validation",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: validationTelemetry.unknown_field_rejected || 0,
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "unknownFieldRejections",
          source: "contracts.validation",
          component: "contracts",
          generatedAt: input.generatedAt,
          tenantContext: input.tenantContext,
        }),
    replayValidationFailures: hasContractTelemetry
      ? createCountMetric({
          name: "replayValidationFailures",
          source: "contracts.replay",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: contractTelemetry.replay_validation_failed || 0,
          status: (contractTelemetry.replay_validation_failed || 0) > 0 ? "CRITICAL" : "OK",
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "replayValidationFailures",
          source: "contracts.replay",
          component: "contracts",
          generatedAt: input.generatedAt,
          tenantContext: input.tenantContext,
        }),
    contractCompatibilityFailures: hasCompatibilityTelemetry
      ? createCountMetric({
          name: "contractCompatibilityFailures",
          source: "contracts.compatibility",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: compatibilityAlerts.length,
          status: compatibilityAlerts.length > 0 ? "CRITICAL" : "OK",
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "contractCompatibilityFailures",
          source: "contracts.compatibility",
          component: "contracts",
          generatedAt: input.generatedAt,
          tenantContext: input.tenantContext,
        }),
    readinessGateFailures: hasGovernanceTelemetry
      ? createCountMetric({
          name: "readinessGateFailures",
          source: "contracts.governance",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: governanceEvents.filter((event) => String(event.type || "") === "api.readiness.failed").length,
          status: governanceEvents.some((event) => String(event.type || "") === "api.readiness.failed") ? "CRITICAL" : "OK",
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "readinessGateFailures",
          source: "contracts.governance",
          component: "contracts",
          generatedAt: input.generatedAt,
          tenantContext: input.tenantContext,
        }),
    governancePolicyFailures: hasGovernanceTelemetry
      ? createCountMetric({
          name: "governancePolicyFailures",
          source: "contracts.governance",
          component: "contracts",
          generatedAt: input.generatedAt,
          value: governanceEvents.filter((event) => String(event.type || "") === "api.governance.failed").length,
          tenantContext: input.tenantContext,
        })
      : createUnknownMetric({
          name: "governancePolicyFailures",
          source: "contracts.governance",
          component: "contracts",
          generatedAt: input.generatedAt,
        }),
    schemaStabilityViolations: createCountMetric({
      name: "schemaStabilityViolations",
      source: "contracts.compatibility",
      component: "contracts",
      generatedAt: input.generatedAt,
      value: compatibilityAlerts.length,
      status: compatibilityAlerts.length > 0 ? "CRITICAL" : "OK",
      tenantContext: input.tenantContext,
    }),
  };

  const sources: ObservabilitySourceStatus[] = [
    {
      name: "contracts.validation",
      status: hasValidationTelemetry ? "AVAILABLE" : "UNAVAILABLE",
      reason: hasValidationTelemetry ? undefined : "VALIDATION_TELEMETRY_UNAVAILABLE",
    },
    {
      name: "contracts.compatibility",
      status: hasCompatibilityTelemetry ? "AVAILABLE" : "UNAVAILABLE",
      reason: hasCompatibilityTelemetry ? undefined : "COMPATIBILITY_ALERTS_UNAVAILABLE",
    },
    {
      name: "contracts.governance",
      status: hasGovernanceTelemetry ? "AVAILABLE" : "UNAVAILABLE",
      reason: hasGovernanceTelemetry ? undefined : "GOVERNANCE_AUDIT_UNAVAILABLE",
    },
  ];

  return {
    metrics,
    sources,
  };
}
