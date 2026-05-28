import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ApprovalPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="approvals">
      <CardHeader><CardTitle>Approvals</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Approval chain: {view.approvals.data.approvalChain.join(", ")}</p>
        <p>Pending reviews: {view.approvals.data.pendingReviews.join(", ")}</p>
        <p>Revoked approvals: {view.approvals.data.revokedApprovals.length ? view.approvals.data.revokedApprovals.join(", ") : "none"}</p>
        <p>Override constraints: {view.approvals.data.overrideConstraints.join(", ")}</p>
      </CardContent>
    </Card>
  );
}
