import "dotenv/config";
import { prisma } from "@/src/server/db/prisma";
import { checkScopeOperationalAlerts } from "@/src/server/monitoring/scope-alert-service";
import {
  recordScopeMonitoringScanCompleted,
  recordScopeMonitoringScanFailure,
  recordScopeMonitoringScanStarted,
} from "@/src/server/monitoring/scope-monitoring-health-service";

async function main() {
  await recordScopeMonitoringScanStarted();

  try {
    const workspaces = await prisma.workspace.findMany({ select: { id: true } });
    const results = await Promise.all(workspaces.map((workspace) => checkScopeOperationalAlerts(workspace.id)));
    const alertsCreated = results.reduce(
      (total, result) => total + result.alertsCreated + result.alertsReactivated,
      0,
    );

    await recordScopeMonitoringScanCompleted({ workspaceCount: workspaces.length, alertsCreated });
    console.log(JSON.stringify({ workspaceCount: workspaces.length, alertsCreated }));
  } catch (error) {
    await recordScopeMonitoringScanFailure(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
