'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Application unavailable</h1>
          <p>Please try again. No internal error details are shown.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
