import type { RiskAnalysis } from "../risk/riskTypes";

export function RiskPanel({ risk }: { risk: RiskAnalysis }) {
  return (
    <section>
      <h2>Risk</h2>
      <p>{risk.risk_tier}</p>
    </section>
  );
}
