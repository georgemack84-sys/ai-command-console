import type { IntelligenceSignal } from "../signals/signalTypes";

export function SignalsPanel({ signals }: { signals: IntelligenceSignal[] }) {
  return (
    <section>
      <h2>Signals</h2>
      <ul>
        {signals.map((signal) => (
          <li key={signal.signal_id}>{signal.explanation}</li>
        ))}
      </ul>
    </section>
  );
}
