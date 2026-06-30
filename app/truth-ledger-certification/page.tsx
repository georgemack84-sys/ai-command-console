import { TruthLedgerCertificationSuiteShell } from "@/components/truth-ledger-certification/TruthLedgerCertificationSuiteShell";
import { buildTruthLedgerCertificationView } from "@/services/truth-ledger-certification";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function TruthLedgerCertificationPage() {
  await requireSessionUser();
  const view = buildTruthLedgerCertificationView({
    certification_id: "truth_ledger_cert_6l_000001",
    tenant_scope: "tenant_alpha",
    mission_scope: "mission_query_layer",
  });

  return <TruthLedgerCertificationSuiteShell view={view} />;
}
