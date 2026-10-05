import Link from "next/link";
import { TandemAuditVerifier } from "@/components/tandem/TandemAuditVerifier";
import { requireNuruGovernorPage } from "@/src/server/api/nuru-api";

export const dynamic = "force-dynamic";

export default async function TandemAuditVerifierPage({ searchParams }: PageProps<"/nuru/tandem-audit-verifier">) {
  await requireNuruGovernorPage("/nuru/tandem-audit-verifier");
  const candidateId = (await searchParams).candidateId;
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Nuru · Tandem Audit</p><h1 className="text-2xl font-semibold">Audit export verifier</h1><p className="mt-1 text-sm text-slate-600">Independently validate an exported candidate lifecycle record.</p></header><TandemAuditVerifier candidateId={typeof candidateId === "string" ? candidateId : undefined} /><Link className="text-sm text-violet-700 underline" href="/nuru/tandem-candidates">Back to candidate review</Link></main>;
}
