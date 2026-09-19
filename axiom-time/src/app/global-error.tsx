"use client";

export default function GlobalError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html lang="en">
      <body>
        <main className="error-page">
          <p>Axiom Time encountered an unexpected display error.</p>
          <button type="button" onClick={reset}>
            Restore clock
          </button>
        </main>
      </body>
    </html>
  );
}
