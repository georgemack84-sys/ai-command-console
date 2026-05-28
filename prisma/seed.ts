import "dotenv/config";
import { randomUUID, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_POLICY_PLAYBOOK_PRESETS,
  ENVIRONMENT_POLICY_DEFAULTS,
  GOVERNANCE_DEFAULTS,
} from "@/src/server/services/policy-governance-service";

const prisma = new PrismaClient();
const policyPrisma = prisma as any;

function hashPassword(password: string) {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "pulse-workspace" },
    update: {
      plan: "enterprise",
    },
    create: {
      name: "Pulse Workspace",
      slug: "pulse-workspace",
      description: "AI-powered monitoring and intelligence workspace for signals, briefs, and operational summaries.",
      plan: "enterprise",
      statusTone: "healthy",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "operator@pulse.local" },
    update: {
      name: "Morgan Lee",
      role: "admin",
      status: "active",
    },
    create: {
      email: "operator@pulse.local",
      name: "Morgan Lee",
      role: "admin",
      status: "active",
      passwordHash: hashPassword("demo-password"),
    },
  });

  const showcaseAdmin = await prisma.user.upsert({
    where: { email: "showcase@pulse.local" },
    update: {
      name: "Showcase Admin",
      role: "admin",
      status: "active",
    },
    create: {
      email: "showcase@pulse.local",
      name: "Showcase Admin",
      role: "admin",
      status: "active",
      passwordHash: hashPassword("Launchpad-Admin-2026"),
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: admin.id,
        workspaceId: workspace.id,
      },
    },
    update: {
      role: "owner",
      isDefault: true,
    },
    create: {
      userId: admin.id,
      workspaceId: workspace.id,
      role: "owner",
      isDefault: true,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: showcaseAdmin.id,
        workspaceId: workspace.id,
      },
    },
    update: {
      role: "owner",
      isDefault: true,
    },
    create: {
      userId: showcaseAdmin.id,
      workspaceId: workspace.id,
      role: "owner",
      isDefault: true,
    },
  });

  const sources = await Promise.all([
    prisma.source.upsert({
      where: { id: "seed-source-incident" },
      update: {},
      create: {
        id: "seed-source-incident",
        workspaceId: workspace.id,
        name: "Incident Feed",
        type: "integration",
        status: "healthy",
        updateCadence: "Every 5 minutes",
        description: "Operational incidents and service quality signals from managed integrations.",
        url: "https://status.example.com",
      },
    }),
    prisma.source.upsert({
      where: { id: "seed-source-market" },
      update: {},
      create: {
        id: "seed-source-market",
        workspaceId: workspace.id,
        name: "Market Intelligence",
        type: "feed",
        status: "healthy",
        updateCadence: "Hourly",
        description: "Competitive and market-moving updates curated for the workspace.",
        url: "https://intelligence.example.com",
      },
    }),
    prisma.source.upsert({
      where: { id: "seed-source-repo" },
      update: {},
      create: {
        id: "seed-source-repo",
        workspaceId: workspace.id,
        name: "Engineering Delivery",
        type: "repository",
        status: "degraded",
        updateCadence: "On commit",
        description: "Code delivery velocity, review pressure, and release-readiness signals.",
        url: "https://github.com/example/pulse",
      },
    }),
  ]);

  await prisma.monitoredUpdate.createMany({
    data: [
      {
        workspaceId: workspace.id,
        sourceId: sources[0].id,
        title: "Escalation volume rose in the EU cluster",
        summary: "Operator load increased 18% after a queue backlog formed around two managed workspaces.",
        status: "needs-review",
        severity: "high",
        category: "Operations",
        happenedAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        workspaceId: workspace.id,
        sourceId: sources[1].id,
        title: "Competitor launched a faster weekly summary workflow",
        summary: "The launch emphasizes auto-organized digests and one-click drilldowns, increasing urgency for insight quality.",
        status: "tracked",
        severity: "medium",
        category: "Market",
        happenedAt: new Date(Date.now() - 75 * 60 * 1000),
      },
      {
        workspaceId: workspace.id,
        sourceId: sources[2].id,
        title: "Release candidate is waiting on one reviewer",
        summary: "Engineering delivery is close to green, but the approval bottleneck is now the slowest step in the cycle.",
        status: "attention",
        severity: "medium",
        category: "Delivery",
        happenedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.insight.createMany({
    data: [
      {
        workspaceId: workspace.id,
        title: "Backlog risk is now concentrated in one approval lane",
        summary: "Routing pressure is healthy overall, but one approval lane is responsible for most late-cycle delay.",
        type: "insight",
        status: "ready",
        confidence: 89,
        sourceIds: [sources[0].id, sources[2].id],
      },
      {
        workspaceId: workspace.id,
        title: "Daily summaries should prioritize review queue movement",
        summary: "The fastest operator win is surfacing review pressure before secondary market items each morning.",
        type: "recommendation",
        status: "ready",
        confidence: 82,
        sourceIds: [sources[0].id, sources[1].id, sources[2].id],
      },
    ],
    skipDuplicates: true,
  });

  await prisma.activityEvent.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: admin.id,
        type: "workspace.summary_published",
        title: "Morning briefing delivered",
        description: "The workspace summary was generated and shared with the operator channel.",
      },
      {
        workspaceId: workspace.id,
        userId: admin.id,
        type: "source.update_ingested",
        title: "EU escalation feed refreshed",
        description: "A new operations update was ingested and linked into the dashboard signal stack.",
      },
      {
        workspaceId: workspace.id,
        userId: admin.id,
        type: "insight.recommendation_queued",
        title: "Insight recommendation flagged",
        description: "A recommendation was promoted for human review before the afternoon handoff.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.featureFlag.createMany({
    data: [
      { key: "alerts_v2", enabled: true, description: "Enable alert records for updates and insights." },
      { key: "connector_registry", enabled: true, description: "Enable ingestion connector registry." },
      { key: "intelligence_scoring", enabled: true, description: "Enable insight scoring metadata." },
      { key: "agent_jobs", enabled: false, description: "Enable agent task execution jobs." },
    ],
    skipDuplicates: true,
  });

  const brief = await prisma.researchBrief.upsert({
    where: { id: "seed-brief-market" },
    update: {},
    create: {
      id: "seed-brief-market",
      workspaceId: workspace.id,
      ownerId: admin.id,
      title: "Measure competitor monitoring narratives",
      question: "How are serious AI workspace products framing speed, trust, and analyst oversight this quarter?",
      status: "in_review",
      priority: "high",
      assignedAgent: "researcher",
      tags: ["market", "messaging", "positioning"],
      summary: "Editorial brief prepared for strategy and product marketing review.",
    },
  });

  await prisma.researchReport.upsert({
    where: { id: "seed-report-market" },
    update: {},
    create: {
      id: "seed-report-market",
      workspaceId: workspace.id,
      briefId: brief.id,
      ownerId: admin.id,
      title: "Competitive monitoring narrative memo",
      format: "memo",
      status: "ready",
      excerpt: "Most serious competitors are emphasizing trust and faster action loops over broad AI claims.",
      keyFindings: [
        "Speed is framed as compressed decision time, not just automation volume.",
        "Teams trust human-in-the-loop workflows more than fully autonomous positioning.",
        "Auditability and workspace-level context are prominent differentiators.",
      ],
    },
  });

  await prisma.savedView.upsert({
    where: { id: "seed-view-ops" },
    update: {},
    create: {
      id: "seed-view-ops",
      workspaceId: workspace.id,
      userId: admin.id,
      name: "Ops focus",
      description: "Prioritize operationally risky updates and the most recent activity.",
      isDefault: true,
      filters: {
        severity: ["high", "critical"],
        categories: ["Operations", "Delivery"],
      },
    },
  });

  await prisma.workspaceOperationsState.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      escalationOwner: "Morgan Lee",
      incidentApproverTarget: "operator@pulse.local",
      backupApproverTarget: "backup@pulse.local",
      incidentStatus: "investigating",
      incidentStatusUpdatedAt: new Date(),
      incidentSummary:
        "Workspace Pulse Workspace is investigating a concentrated approval-lane slowdown and elevated EU escalation pressure.",
      incidentSummaryUpdatedAt: new Date(),
      incidentChecklist: [
        { id: "owner_assigned", label: "Assign an incident owner", completed: true, completedAt: new Date().toISOString(), completedByName: "Morgan Lee" },
        { id: "followup_created", label: "Create a remediation follow-up", completed: true, completedAt: new Date().toISOString(), completedByName: "Morgan Lee" },
        { id: "summary_generated", label: "Generate an incident summary", completed: true, completedAt: new Date().toISOString(), completedByName: "Morgan Lee" },
        { id: "shared_handoff", label: "Share the incident handoff", completed: false, completedAt: null, completedByName: null },
      ],
      lastGeneratedCount: 2,
    },
  });

  await prisma.operationsFollowup.upsert({
    where: { id: "seed-followup-ops" },
    update: {},
    create: {
      id: "seed-followup-ops",
      workspaceId: workspace.id,
      agentName: "builder",
      description: "Investigate the approval-lane slowdown and recommend a stable handoff plan.",
      status: "queued",
      priority: 2,
      ownerName: "Morgan Lee",
    },
  });

  await policyPrisma.platformGovernanceSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      currentEnvironment: GOVERNANCE_DEFAULTS.currentEnvironment,
      sensitiveActionsRequireApproval: GOVERNANCE_DEFAULTS.sensitiveActionsRequireApproval,
      demoScenarioId: GOVERNANCE_DEFAULTS.demoScenario.id,
      demoScenarioName: GOVERNANCE_DEFAULTS.demoScenario.name,
      demoScenarioDescription: GOVERNANCE_DEFAULTS.demoScenario.description,
    },
  });

  await Promise.all(
    Object.entries(ENVIRONMENT_POLICY_DEFAULTS).map(([environment, policy]) =>
      policyPrisma.environmentPolicy.upsert({
        where: { environment },
        update: {},
        create: {
          environment,
          ...policy,
        },
      }),
    ),
  );

  await policyPrisma.policyPlaybook.createMany({
    data: DEFAULT_POLICY_PLAYBOOK_PRESETS.map((playbook) => ({ ...playbook })),
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
