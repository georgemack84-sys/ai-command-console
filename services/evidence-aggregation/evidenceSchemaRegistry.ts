import { EVIDENCE_AGGREGATION_SCHEMA_VERSION } from "./evidenceAggregationContracts";

export const EVIDENCE_SCHEMA_REGISTRY = Object.freeze({
  schemaId: "evidence-aggregation-schema-v1",
  version: EVIDENCE_AGGREGATION_SCHEMA_VERSION,
  supportedEvidenceTypes: Object.freeze([
    "telemetry",
    "replay",
    "validation",
    "governance",
    "integrity",
    "policy",
    "operator",
  ]),
});
