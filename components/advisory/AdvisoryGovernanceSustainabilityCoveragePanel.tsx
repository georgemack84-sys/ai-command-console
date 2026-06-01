import type { GovernanceSustainabilityCertification } from "@/services/advisory/advisoryGovernanceSustainabilityCertificationGate";

function rowLabel(label: string, value: boolean) {
  return `${label} ${String(value)}`;
}

export function AdvisoryGovernanceSustainabilityCoveragePanel({
  certification,
}: {
  certification: GovernanceSustainabilityCertification;
}) {
  const sections = [
    {
      title: "Maintenance Coverage",
      testId: "sustainability-maintenance-coverage",
      rows: [
        rowLabel("coverage visible", certification.maintenanceCoverage.coverageVisible),
        rowLabel("gaps visible", certification.maintenanceCoverage.gapsVisible),
        rowLabel("lineage preserved", certification.maintenanceCoverage.lineagePreserved),
      ],
    },
    {
      title: "Seal Preservation",
      testId: "sustainability-seal-preservation",
      rows: [
        rowLabel("seal chain coverage", certification.sealPreservationCoverage.sealChainCoverage),
        rowLabel("seal dependency visibility", certification.sealPreservationCoverage.sealDependencyVisibility),
        rowLabel("seal continuity", certification.sealPreservationCoverage.sealContinuity),
        rowLabel("seal replayability", certification.sealPreservationCoverage.sealReplayability),
      ],
    },
    {
      title: "Documentation Survivability",
      testId: "sustainability-documentation-survivability",
      rows: [
        rowLabel("architecture documentation coverage", certification.documentationSurvivability.architectureDocumentationCoverage),
        rowLabel("operator handbook coverage", certification.documentationSurvivability.operatorHandbookCoverage),
        rowLabel("verification workflow coverage", certification.documentationSurvivability.verificationWorkflowCoverage),
        rowLabel("seal history preservation", certification.documentationSurvivability.sealHistoryPreservation),
      ],
    },
    {
      title: "ADR Continuity",
      testId: "sustainability-adr-continuity",
      rows: [
        rowLabel("ADR lineage preserved", certification.adrContinuity.adrLineagePreserved),
        rowLabel("append only preserved", certification.adrContinuity.appendOnlyPreserved),
        rowLabel("supersession rules preserved", certification.adrContinuity.supersessionRulesPreserved),
        rowLabel("decision continuity maintained", certification.adrContinuity.decisionContinuityMaintained),
        rowLabel("rationale preserved", certification.adrContinuity.rationalePreserved),
      ],
    },
    {
      title: "Artifact Preservation",
      testId: "sustainability-artifact-preservation",
      rows: [
        rowLabel("sealed artifacts retained", certification.artifactPreservation.sealedArtifactsRetained),
        rowLabel("deprecated artifacts marked", certification.artifactPreservation.deprecatedArtifactsMarked),
        rowLabel("lineage retained", certification.artifactPreservation.lineageRetained),
        rowLabel("references retained", certification.artifactPreservation.referencesRetained),
      ],
    },
    {
      title: "Drift Resistance",
      testId: "sustainability-drift-resistance",
      rows: [
        rowLabel("governance drift exposure visible", certification.driftResistance.governanceDriftExposureVisible),
        rowLabel("boundary survivability", certification.driftResistance.boundarySurvivability),
        rowLabel("authority expansion resistance", certification.driftResistance.authorityExpansionResistance),
        rowLabel("knowledge preservation", certification.driftResistance.knowledgePreservation),
      ],
    },
  ];

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-sustainability-coverage-panel">
      <p className="text-xs uppercase text-sky-200">Sustainability Coverage</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Long-horizon governance evidence</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" data-testid={section.testId} key={section.title}>
            <p className="text-xs uppercase text-slate-400">{section.title}</p>
            <ul className="mt-3 space-y-2">
              {section.rows.map((row) => (
                <li className="text-sm text-slate-100" key={row}>{row}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
