'use client';
import { useAuthentication } from '@/lib/auth/auth-context';
export default function DashboardPage() {
  const { state } = useAuthentication();
  if (state.status !== 'authenticated') return null;
  return (
    <section>
      <h1>Dashboard</h1>
      <p>Welcome, {state.user.displayName}.</p>
    </section>
  );
}
