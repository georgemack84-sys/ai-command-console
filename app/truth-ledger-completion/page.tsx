import { TruthLedgerCompletionGateShell } from "@/components/truth-ledger-completion/TruthLedgerCompletionGateShell";
import { buildTruthLedgerCompletionGateView } from "@/services/truth-ledger-completion";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function TruthLedgerCompletionPage() {
  await requireSessionUser();
  return <TruthLedgerCompletionGateShell view={buildTruthLedgerCompletionGateView()} />;
}
