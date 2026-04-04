"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-100">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Application error</h1>
          <p className="mt-3 text-sm text-zinc-400">
            {error.message || "An unexpected error occurred while rendering the app."}
          </p>
          <button
            className="mt-6 rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
