import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ContainmentPanel({
  containmentState,
  isolatedSystems,
  continuityProtection,
  frozenOperations,
  survivabilityProtocols,
  emergencyContainment,
  runtimePartitions,
  degradedOperationalZones,
}: {
  containmentState: string;
  isolatedSystems: string[];
  continuityProtection: string[];
  frozenOperations: string[];
  survivabilityProtocols: string[];
  emergencyContainment: boolean;
  runtimePartitions: string[];
  degradedOperationalZones: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Containment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{containmentState}</p>
        <p>Isolated systems: {isolatedSystems.length ? isolatedSystems.join(", ") : "none"}</p>
        <p>Continuity protection: {continuityProtection.length ? continuityProtection.join(", ") : "none"}</p>
        <p>Frozen operations: {frozenOperations.length ? frozenOperations.join(", ") : "none"}</p>
        <p>Protocols: {survivabilityProtocols.length ? survivabilityProtocols.join(", ") : "none"}</p>
        <p>Emergency containment: {emergencyContainment ? "active" : "inactive"}</p>
        <p>Runtime partitions: {runtimePartitions.length ? runtimePartitions.join(", ") : "none"}</p>
        <p>Degraded zones: {degradedOperationalZones.length ? degradedOperationalZones.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
