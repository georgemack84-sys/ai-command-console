import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryEvidenceBundle } from "@/types/recoveryEvidence";

export function RecoveryEvidencePanel({
  evidence,
  onExportJson,
  onExportMarkdown,
}: {
  evidence: RecoveryEvidenceBundle | null;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}) {
  if (!evidence) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">No evidence bundle loaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-slate-200">
          <p>Evidence State: {evidence.state}</p>
          <p>Integrity Hash: <span className="break-all text-slate-100">{evidence.integrity.hash}</span></p>
          <p>Hash Algorithm: {evidence.integrity.algorithm}</p>
          <p>matchesReadModel: {String(evidence.integrity.matchesReadModel)}</p>
          <p>Version: {evidence.meta.version}</p>
        </div>

        {evidence.state === "disputed" ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
            ⚠️ Evidence inconsistency detected. Review before taking action.
          </div>
        ) : null}

        {evidence.meta.warnings.length > 0 ? (
          <ul className="space-y-1 text-sm text-slate-300">
            {evidence.meta.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-2 md:grid-cols-2">
          <Button variant="outline" onClick={onExportJson}>Export JSON</Button>
          <Button variant="outline" onClick={onExportMarkdown}>Export Markdown</Button>
        </div>
      </CardContent>
    </Card>
  );
}

