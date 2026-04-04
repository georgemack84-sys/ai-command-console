export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-zinc-400">
          The requested route is not available in AI Command Console.
        </p>
      </div>
    </main>
  );
}
