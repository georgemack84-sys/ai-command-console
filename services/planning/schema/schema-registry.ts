import type { ZodTypeAny } from "zod";

import { inspectSchema } from "@/services/contracts/schemaCompiler";
import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import { canonicalPlanSchema } from "./canonical-plan";

export type SchemaApprovalMetadata = {
  approved: boolean;
  approvedBy: string;
  policyRefs: string[];
  publishedAt: string;
};

export type CanonicalSchemaRecord = {
  schemaId: "canonical-plan";
  version: string;
  schema: ZodTypeAny;
  hash: string;
  current: boolean;
  deprecated: boolean;
  compatibleVersions: readonly string[];
  approval: SchemaApprovalMetadata;
};

function createSchemaRecord(input: Omit<CanonicalSchemaRecord, "hash">): CanonicalSchemaRecord {
  const hash = hashPayloadDeterministically({
    schemaId: input.schemaId,
    version: input.version,
    schema: inspectSchema(input.schema),
    current: input.current,
    deprecated: input.deprecated,
    compatibleVersions: input.compatibleVersions,
    approval: input.approval,
  });

  return {
    ...input,
    hash,
  };
}

const canonicalSchemaRegistry: readonly CanonicalSchemaRecord[] = Object.freeze([
  createSchemaRecord({
    schemaId: "canonical-plan",
    version: "1.0.0",
    schema: canonicalPlanSchema,
    current: false,
    deprecated: true,
    compatibleVersions: ["1.0.0"],
    approval: {
      approved: true,
      approvedBy: "mission-control",
      policyRefs: ["planning.schema.v1"],
      publishedAt: "2026-05-14T00:00:00.000Z",
    },
  }),
  createSchemaRecord({
    schemaId: "canonical-plan",
    version: "1.0.1",
    schema: canonicalPlanSchema,
    current: false,
    deprecated: true,
    compatibleVersions: ["1.0.1"],
    approval: {
      approved: true,
      approvedBy: "mission-control",
      policyRefs: ["planning.schema.v1.0.1"],
      publishedAt: "2026-05-14T00:00:00.000Z",
    },
  }),
  createSchemaRecord({
    schemaId: "canonical-plan",
    version: "1.1.0",
    schema: canonicalPlanSchema,
    current: true,
    deprecated: false,
    compatibleVersions: ["1.1.0", "1.0.1", "1.0.0"],
    approval: {
      approved: true,
      approvedBy: "mission-control",
      policyRefs: ["planning.schema.v1.1"],
      publishedAt: "2026-05-14T00:00:00.000Z",
    },
  }),
]);

export function listCanonicalSchemas() {
  return canonicalSchemaRegistry.map((entry) => ({ ...entry }));
}

export function getCurrentCanonicalSchema() {
  const current = canonicalSchemaRegistry.find((entry) => entry.current);
  if (!current) {
    throw new Error("PHASE42A_SCHEMA_VERSION_UNSUPPORTED");
  }
  return { ...current };
}

export function getSchemaByVersion(version: string) {
  const entry = canonicalSchemaRegistry.find((candidate) => candidate.version === version);
  return entry ? { ...entry } : undefined;
}

