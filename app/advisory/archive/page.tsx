import { requireSessionUser } from "@/src/lib/auth";
import { AdvisoryEvidenceArchivePanel } from "@/components/advisory/AdvisoryEvidenceArchivePanel";
import type { AdvisoryEvidenceArchiveEntry } from "@/services/advisory/advisoryEvidenceArchiveIndex";

export const dynamic = "force-dynamic";

const EMPTY_ARCHIVE_ENTRIES: readonly AdvisoryEvidenceArchiveEntry[] = Object.freeze([]);

export default async function AdvisoryEvidenceArchivePage() {
  await requireSessionUser();

  return <AdvisoryEvidenceArchivePanel entries={EMPTY_ARCHIVE_ENTRIES} />;
}
