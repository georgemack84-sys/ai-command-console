import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ConstitutionalStatusPanel({
  constitutionalState,
  governanceIntegrity,
  activeRestrictions,
  emergencyGovernance,
  containmentActive,
  enforcementState,
  replayVerificationState,
  disputePresent,
  operationalFreeze,
}: {
  constitutionalState: string;
  governanceIntegrity: number;
  activeRestrictions: string[];
  emergencyGovernance: boolean;
  containmentActive: boolean;
  enforcementState: string;
  replayVerificationState: string;
  disputePresent: boolean;
  operationalFreeze: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{constitutionalState}</p>
        <p>Governance integrity: {Math.round(governanceIntegrity * 100)}%</p>
        <p>Enforcement: {enforcementState}</p>
        <p>Replay verification: {replayVerificationState}</p>
        <p>Emergency governance: {emergencyGovernance ? "active" : "inactive"}</p>
        <p>Containment: {containmentActive ? "active" : "inactive"}</p>
        <p>Disputes: {disputePresent ? "present" : "none"}</p>
        <p>Freeze: {operationalFreeze ? "active" : "clear"}</p>
        <p>Restrictions: {activeRestrictions.length ? activeRestrictions.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
