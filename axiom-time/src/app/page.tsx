import { ClockDisplay } from "@/components/clock-display";

export default function Home() {
  return (
    <main className="scene">
      <div className="sky" aria-hidden="true" />
      <div className="mountain mountain-left" aria-hidden="true" />
      <div className="mountain mountain-right" aria-hidden="true" />
      <div className="lake" aria-hidden="true" />
      <ClockDisplay />
      <p className="core-status">Deterministic time core · local device time</p>
    </main>
  );
}
