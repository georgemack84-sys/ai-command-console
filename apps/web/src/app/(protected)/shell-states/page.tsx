export default function ShellStatesPage() {
  return (
    <section>
      <h1>
        A deliberately long shell states page title that wraps without
        destabilizing navigation
      </h1>
      <p>
        Use this route to verify tall content and responsive shell behavior.
      </p>
      {Array.from({ length: 20 }, (_, index) => (
        <p key={index}>Workspace content row {index + 1}</p>
      ))}
    </section>
  );
}
