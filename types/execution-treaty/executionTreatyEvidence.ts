import type { ProductionCertificationRecord, ProductionTrustEvidence, ProductionTrustLedgerEvent } from "@/services/production-trust-framework";
import type { ExecutionTreatyForensicBindings } from "./forensicBindings";
import type { ExecutionTreatyManifest } from "./executionTreatyManifest";
import type { ExecutionTreatyProvenanceBindings } from "./provenanceBindings";
import type { ExecutionTreatySurvivabilityBindings } from "./survivabilityBindings";

export type ExecutionTreatyEvidence = Readonly<{
  productionCertification: ProductionCertificationRecord;
  productionEvidence: ProductionTrustEvidence;
  operationalTrustLedger: readonly ProductionTrustLedgerEvent[];
  provenance: ExecutionTreatyProvenanceBindings;
  survivability: ExecutionTreatySurvivabilityBindings;
  forensic: ExecutionTreatyForensicBindings;
  registryLineageHash: string;
  governanceLineageHash: string;
  replayLineageHash: string;
}>;

export type ExecutionTreatyLedgerEvent = Readonly<{
  eventType:
    | "treaty.created"
    | "treaty.revalidation-required"
    | "treaty.revoked"
    | "treaty.quarantined"
    | "treaty.archived";
  treatyId: string;
  result: "success" | "failure";
  errorCode?: string;
  eventHash: string;
  occurredAt?: string;
}>;

export type ExecutionTreatyPackage = Readonly<{
  manifest: ExecutionTreatyManifest;
  evidence: ExecutionTreatyEvidence;
  hashes: import("./executionTreatyHashes").ExecutionTreatyHashes;
  ledger: readonly ExecutionTreatyLedgerEvent[];
}>;
