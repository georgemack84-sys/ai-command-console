import { hashExecutionTreatyArchive } from "./executionTreatyHasher";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";

export type ExecutionTreatyArchiveRecord = Readonly<{
  treatyId: string;
  treatyHash: string;
  archiveHash: string;
}>;

export function archiveExecutionTreaty(treaty: ExecutionTreatyPackage): ExecutionTreatyArchiveRecord {
  const payload = {
    treatyId: treaty.manifest.treatyId,
    treatyHash: treaty.hashes.treatyHash,
  };
  return {
    ...payload,
    archiveHash: hashExecutionTreatyArchive(payload),
  };
}
