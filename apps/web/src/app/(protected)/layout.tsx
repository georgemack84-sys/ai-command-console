import { ProtectedExperienceBoundary } from '@/components/auth/protected-experience-boundary';
import { ApplicationShell } from '@/shell/components/application-shell';
export const dynamic = 'force-dynamic';
export default function ProtectedLayout({ children }: React.PropsWithChildren) {
  return (
    <ProtectedExperienceBoundary>
      <ApplicationShell>{children}</ApplicationShell>
    </ProtectedExperienceBoundary>
  );
}
