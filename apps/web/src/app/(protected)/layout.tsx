import { ProtectedExperienceBoundary } from '@/components/auth/protected-experience-boundary';
import { UserMenu } from '@/components/auth/user-menu';
import { ApplicationShell } from '@/shell/components/application-shell';
export const dynamic = 'force-dynamic';
export default function ProtectedLayout({ children }: React.PropsWithChildren) {
  return (
    <ProtectedExperienceBoundary>
      <ApplicationShell accountSlot={<UserMenu />}>{children}</ApplicationShell>
    </ProtectedExperienceBoundary>
  );
}
