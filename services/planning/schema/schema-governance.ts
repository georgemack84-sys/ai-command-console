import type { ValidationIssue } from "../contracts/validation-types";
import { getSchemaByVersion } from "./schema-registry";

export function checkSchemaGovernance(version: string, hash: string) {
  const issues: ValidationIssue[] = [];
  const schema = getSchemaByVersion(version);

  if (!schema) {
    issues.push({
      code: "PHASE42A_SCHEMA_VERSION_UNSUPPORTED",
      path: "schemaVersion",
      message: "Schema version is not approved.",
    });
    return {
      valid: false,
      issues,
    };
  }

  if (!schema.approval?.approved || !schema.approval.approvedBy || schema.approval.policyRefs.length === 0) {
    issues.push({
      code: "PHASE42A_SCHEMA_NOT_APPROVED",
      path: "approval",
      message: "Schema approval metadata is required.",
    });
  }

  if (schema.hash !== hash) {
    issues.push({
      code: "PHASE42A_SCHEMA_HASH_MISMATCH",
      path: "hash",
      message: "Schema hash does not match immutable registry record.",
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
