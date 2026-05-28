import type { CoordinationReadinessCertificationState } from "./certificationStates";

export type CertificationLineageEntry = Readonly<{
  entryId: string;
  certificationId: string;
  coordinationId: string;
  certificationState: CoordinationReadinessCertificationState;
  createdAt: string;
  deterministicHash: string;
}>;

export type CertificationLineage = Readonly<{
  lineageId: string;
  entries: readonly CertificationLineageEntry[];
  lineageHash: string;
}>;
