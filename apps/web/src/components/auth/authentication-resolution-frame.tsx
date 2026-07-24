import { Spinner } from '@/ui/components/primitives';
export function AuthenticationResolutionFrame() {
  return (
    <main className="auth-resolution" aria-live="polite">
      <Spinner label="Resolving your session" />
      <p>Resolving your session…</p>
    </main>
  );
}
